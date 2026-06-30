from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.verification.engine import verify_submission

@celery_app.task(name="tasks.verify_graph_submission", acks_late=True)
def verify_graph_submission(submission_id: int):
    db = SessionLocal()
    try:
        verify_submission(db, submission_id)
    finally:
        db.close()
