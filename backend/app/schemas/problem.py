from pydantic import BaseModel
from datetime import datetime
from typing import Any, Optional

class ProblemBase(BaseModel):
    title: str
    statement_text: str
    object_type: str = "graph"
    size_metric: str = "vertices"
    verification_predicate_ref: str

class ProblemCreate(ProblemBase):
    pass

class ProblemResponse(ProblemBase):
    id: int
    status: str
    created_at: datetime
    difficulty: Optional[str] = None
    why_false: Optional[str] = None
    known_minimal_counterexample: Optional[dict[str, Any]] = None
    draft_predicate: Optional[str] = None
    record_size: Optional[int] = None
    record_holder: Optional[str] = None

    class Config:
        from_attributes = True
