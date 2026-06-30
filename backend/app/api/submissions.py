from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.submission import Submission
from app.models.problem import Problem
from app.models.user import User
from app.schemas.submission import SubmissionCreate, SubmissionResponse, SubmissionDetailResponse
from app.api.deps import get_current_user
from app.config import settings
from app.verification.engine import verify_submission
from app.core.rate_limit import rate_limit

router = APIRouter()

@router.post("/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(rate_limit(requests=5, window_seconds=60))])
def create_submission(
    submission_in: SubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate problem exists
    problem = db.query(Problem).filter(Problem.id == submission_in.problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )
    
    # Store submission object_data as dict/json
    submission = Submission(
        problem_id=submission_in.problem_id,
        user_id=current_user.id,
        object_data=submission_in.object_data.model_dump(),
        verification_status="pending",
        is_record=False
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    # Trigger verification
    if settings.USE_CELERY:
        try:
            from app.workers.tasks import verify_graph_submission
            verify_graph_submission.delay(submission.id)
        except Exception:
            # Fallback to local background tasks if celery is not configured correctly
            background_tasks.add_task(verify_submission, db, submission.id)
    else:
        background_tasks.add_task(verify_submission, db, submission.id)
        
    return submission

@router.get("/problem/{problem_id}", response_model=List[SubmissionDetailResponse])
def list_submissions(problem_id: int, db: Session = Depends(get_db)):
    submissions = db.query(Submission).filter(
        Submission.problem_id == problem_id
    ).order_by(Submission.created_at.desc()).limit(50).all()
    
    results = []
    for sub in submissions:
        user = db.query(User).filter(User.id == sub.user_id).first()
        username = user.username if user else "Unknown"
        results.append(
            SubmissionDetailResponse(
                id=sub.id,
                problem_id=sub.problem_id,
                user_id=sub.user_id,
                object_data=sub.object_data,
                size_value=sub.size_value,
                verification_status=sub.verification_status,
                verification_reason=sub.verification_reason,
                is_record=sub.is_record,
                created_at=sub.created_at,
                username=username
            )
        )
    return results

@router.get("/{id}", response_model=SubmissionDetailResponse)
def get_submission(id: int, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    user = db.query(User).filter(User.id == sub.user_id).first()
    username = user.username if user else "Unknown"
    return SubmissionDetailResponse(
        id=sub.id,
        problem_id=sub.problem_id,
        user_id=sub.user_id,
        object_data=sub.object_data,
        size_value=sub.size_value,
        verification_status=sub.verification_status,
        verification_reason=sub.verification_reason,
        is_record=sub.is_record,
        created_at=sub.created_at,
        username=username
    )

@router.get("/{id}/status")
def get_submission_status(id: int, db: Session = Depends(get_db)):
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    return {
        "status": sub.verification_status,
        "reason": sub.verification_reason,
        "size": sub.size_value,
        "is_record": sub.is_record
    }
