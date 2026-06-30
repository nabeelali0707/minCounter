from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.problem import Problem
from app.models.leaderboard import LeaderboardEntry
from app.models.submission import Submission
from app.models.user import User
from app.schemas.problem import ProblemResponse

router = APIRouter()

@router.get("/", response_model=List[ProblemResponse])
def list_problems(db: Session = Depends(get_db)):
    problems = db.query(Problem).filter(Problem.status == "active").all()
    results = []
    
    for problem in problems:
        # Find the record entry (smallest best_size_value)
        record = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.problem_id == problem.id
        ).order_by(LeaderboardEntry.best_size_value.asc()).first()
        
        record_size = None
        record_holder = None
        
        if record:
            record_size = record.best_size_value
            user = db.query(User).filter(User.id == record.user_id).first()
            if user:
                record_holder = user.username
                
        results.append(
            ProblemResponse(
                id=problem.id,
                title=problem.title,
                statement_text=problem.statement_text,
                object_type=problem.object_type,
                size_metric=problem.size_metric,
                verification_predicate_ref=problem.verification_predicate_ref,
                status=problem.status,
                created_at=problem.created_at,
                record_size=record_size,
                record_holder=record_holder
            )
        )
    return results

@router.get("/{id}", response_model=ProblemResponse)
def get_problem(id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )
        
    record = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.problem_id == problem.id
    ).order_by(LeaderboardEntry.best_size_value.asc()).first()
    
    record_size = None
    record_holder = None
    
    if record:
        record_size = record.best_size_value
        user = db.query(User).filter(User.id == record.user_id).first()
        if user:
            record_holder = user.username
            
    return ProblemResponse(
        id=problem.id,
        title=problem.title,
        statement_text=problem.statement_text,
        object_type=problem.object_type,
        size_metric=problem.size_metric,
        verification_predicate_ref=problem.verification_predicate_ref,
        status=problem.status,
        created_at=problem.created_at,
        record_size=record_size,
        record_holder=record_holder
    )

@router.get("/{id}/record-graph")
def get_problem_record_graph(id: int, db: Session = Depends(get_db)):
    """
    Returns the graph data of the current record holder.
    """
    record = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.problem_id == id
    ).order_by(LeaderboardEntry.best_size_value.asc()).first()
    
    if not record:
        return {"nodes": [], "edges": []}
        
    submission = db.query(Submission).filter(Submission.id == record.submission_id).first()
    if not submission:
        return {"nodes": [], "edges": []}
        
    return submission.object_data

@router.get("/{id}/history")
def get_problem_history(id: int, db: Session = Depends(get_db)):
    """
    Returns the historical progression of the minimal record for the problem.
    """
    # Get all successful submissions sorted by creation time
    subs = db.query(Submission).filter(
        Submission.problem_id == id,
        Submission.verification_status == "passed"
    ).order_by(Submission.created_at.asc()).all()
    
    history = []
    current_min = float('inf')
    for sub in subs:
        if sub.size_value < current_min:
            current_min = sub.size_value
            user = db.query(User).filter(User.id == sub.user_id).first()
            history.append({
                "submission_id": sub.id,
                "username": user.username if user else "Unknown",
                "size": sub.size_value,
                "achieved_at": sub.created_at
            })
    return history

