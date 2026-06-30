from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    best_size_value = Column(Integer, nullable=False)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    achieved_at = Column(DateTime, default=datetime.utcnow)

    problem = relationship("Problem", back_populates="leaderboard_entries")
    user = relationship("User", back_populates="leaderboard_entries")
