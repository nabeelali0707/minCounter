from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, index=True, nullable=False)
    statement_text = Column(Text, nullable=False)
    object_type = Column(String, default="graph") # e.g. graph
    size_metric = Column(String, default="vertices") # e.g. vertices, edges
    verification_predicate_ref = Column(String, nullable=False) # e.g. chromatic_k4
    status = Column(String, default="active") # draft, active, archived
    difficulty = Column(String, nullable=True) # beginner, medium, hard
    why_false = Column(Text, nullable=True)
    known_minimal_counterexample = Column(JSON, nullable=True)
    draft_predicate = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="problem")
    leaderboard_entries = relationship("LeaderboardEntry", back_populates="problem")
