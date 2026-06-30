import logging
from sqlalchemy.orm import Session
from app.models.submission import Submission
from app.models.problem import Problem
from app.models.leaderboard import LeaderboardEntry
from app.verification.graph_utils import parse_graph_json
from app.verification.registry import get_predicate

logger = logging.getLogger(__name__)

def verify_submission(db: Session, submission_id: int) -> Submission:
    """
    Core verification logic. Parses the graph, runs the predicate, 
    and updates the leaderboard if it is a new record.
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        logger.error(f"Submission {submission_id} not found.")
        return None

    problem = db.query(Problem).filter(Problem.id == submission.problem_id).first()
    if not problem:
        submission.verification_status = "failed"
        submission.verification_reason = "Problem not found."
        db.commit()
        return submission

    try:
        # 1. Parse Graph
        G = parse_graph_json(submission.object_data)
        
        # 2. Compute Size
        predicate = get_predicate(problem.verification_predicate_ref)
        size = predicate.get_size(G)
        submission.size_value = size

        # 3. Run Predicate Checker
        is_valid_counterexample, reason = predicate.verify(G)
        
        if is_valid_counterexample:
            submission.verification_status = "passed"
            submission.verification_reason = reason
            
            # 4. Check if it's a new record
            # Find the current minimal record on the leaderboard for this problem
            current_record = db.query(LeaderboardEntry).filter(
                LeaderboardEntry.problem_id == problem.id
            ).order_by(LeaderboardEntry.best_size_value.asc()).first()

            is_new_record = False
            if not current_record:
                is_new_record = True
            elif size < current_record.best_size_value:
                is_new_record = True
                # If we broke the record, mark the previous record-holding submissions as not active records
                # (is_record in Submission table represents if it's the CURRENT active record)
                db.query(Submission).filter(
                    Submission.problem_id == problem.id,
                    Submission.is_record == True
                ).update({Submission.is_record: False})
            
            if is_new_record:
                submission.is_record = True
                
                # Update or create leaderboard entry for this user and problem
                user_leaderboard_entry = db.query(LeaderboardEntry).filter(
                    LeaderboardEntry.problem_id == problem.id,
                    LeaderboardEntry.user_id == submission.user_id
                ).first()

                if user_leaderboard_entry:
                    # Update if the new submission is smaller than their previous personal best
                    if size < user_leaderboard_entry.best_size_value:
                        user_leaderboard_entry.best_size_value = size
                        user_leaderboard_entry.submission_id = submission.id
                        user_leaderboard_entry.achieved_at = submission.created_at
                else:
                    new_entry = LeaderboardEntry(
                        problem_id=problem.id,
                        user_id=submission.user_id,
                        best_size_value=size,
                        submission_id=submission.id,
                        achieved_at=submission.created_at
                    )
                    db.add(new_entry)
        else:
            submission.verification_status = "failed"
            submission.verification_reason = reason
            submission.is_record = False

    except ValueError as e:
        # User input formatting error
        submission.verification_status = "failed"
        submission.verification_reason = f"Format error: {str(e)}"
        submission.is_record = False
    except Exception as e:
        # Unexpected server/internal error
        logger.exception("Unexpected error during verification")
        submission.verification_status = "failed"
        submission.verification_reason = f"Internal verification error: {str(e)}"
        submission.is_record = False

    db.commit()
    db.refresh(submission)
    return submission
