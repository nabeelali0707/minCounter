from pydantic import BaseModel
from datetime import datetime
from typing import List, Union, Optional, Any

class NodeSchema(BaseModel):
    id: Union[str, int]
    label: Optional[str] = None

class EdgeSchema(BaseModel):
    source: Union[str, int]
    target: Union[str, int]

class GraphSchema(BaseModel):
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]

class SubmissionCreate(BaseModel):
    problem_id: int
    object_data: GraphSchema

class SubmissionResponse(BaseModel):
    id: int
    problem_id: int
    user_id: int
    object_data: GraphSchema
    size_value: Optional[int]
    verification_status: str
    verification_reason: Optional[str]
    is_record: bool
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionDetailResponse(SubmissionResponse):
    username: str

    class Config:
        from_attributes = True
