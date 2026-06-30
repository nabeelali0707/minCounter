from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.database import get_db
from app.models.leaderboard import LeaderboardEntry
from app.models.problem import Problem
from app.models.user import User
from app.models.submission import Submission

router = APIRouter()

@router.get("/problem/{problem_id}")
def get_problem_leaderboard(problem_id: int, db: Session = Depends(get_db)):
    """
    Returns the leaderboard for a specific problem, sorted by best size value (ascending).
    """
    entries = db.query(LeaderboardEntry).filter(
        LeaderboardEntry.problem_id == problem_id
    ).order_by(LeaderboardEntry.best_size_value.asc(), LeaderboardEntry.achieved_at.asc()).all()

    results = []
    for rank, entry in enumerate(entries, 1):
        user = db.query(User).filter(User.id == entry.user_id).first()
        submission = db.query(Submission).filter(Submission.id == entry.submission_id).first()
        results.append({
            "rank": rank,
            "username": user.username if user else "Unknown",
            "size": entry.best_size_value,
            "submission_id": entry.submission_id,
            "achieved_at": entry.achieved_at,
            # include the object_data if they want to render it
            "graph_data": submission.object_data if submission else None
        })
    return results

@router.get("/global")
def get_global_leaderboard(db: Session = Depends(get_db)):
    """
    Returns the global leaderboard, ranking users by the number of active records they hold,
    and secondarily by the number of problems solved.
    """
    # 1. Get all active problems
    problems = db.query(Problem).filter(Problem.status == "active").all()
    
    # 2. Find the current absolute record size for each problem
    problem_records = {}
    for problem in problems:
        best_entry = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.problem_id == problem.id
        ).order_by(LeaderboardEntry.best_size_value.asc()).first()
        if best_entry:
            problem_records[problem.id] = best_entry.best_size_value

    # 3. Aggregate stats per user
    users = db.query(User).all()
    user_stats = []
    
    for user in users:
        # Count problems this user has solved (has a leaderboard entry)
        solved_count = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.user_id == user.id
        ).count()
        
        # Count active records (where their leaderboard entry size matches the absolute best record for that problem)
        records_held = 0
        user_entries = db.query(LeaderboardEntry).filter(
            LeaderboardEntry.user_id == user.id
        ).all()
        
        for entry in user_entries:
            if entry.problem_id in problem_records and entry.best_size_value == problem_records[entry.problem_id]:
                records_held += 1
                
        if solved_count > 0:
            user_stats.append({
                "username": user.username,
                "records_held": records_held,
                "problems_solved": solved_count
            })
            
    # Sort: records_held desc, then problems_solved desc
    user_stats.sort(key=lambda x: (-x["records_held"], -x["problems_solved"]))
    
    # Add rank
    for rank, stat in enumerate(user_stats, 1):
        stat["rank"] = rank
        
    return user_stats
