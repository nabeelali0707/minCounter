from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    object_data = Column(JSON, nullable=False) # contains the graph nodes/edges
    size_value = Column(Integer, nullable=True) # e.g. 11 for Grotzsch graph
    verification_status = Column(String, default="pending") # pending, passed, failed
    verification_reason = Column(String, nullable=True) # e.g. "Contains K4 subgraph"
    is_record = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    problem = relationship("Problem", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
