"""Add AI problem generation fields

Revision ID: 8a1f7c4e3c21
Revises: 2b227d74f3da
Create Date: 2026-07-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8a1f7c4e3c21"
down_revision: Union[str, Sequence[str], None] = "2b227d74f3da"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("problems", sa.Column("difficulty", sa.String(), nullable=True))
    op.add_column("problems", sa.Column("why_false", sa.Text(), nullable=True))
    op.add_column("problems", sa.Column("known_minimal_counterexample", sa.JSON(), nullable=True))
    op.add_column("problems", sa.Column("draft_predicate", sa.Text(), nullable=True))
    op.alter_column("users", "is_admin", server_default=None)


def downgrade() -> None:
    op.drop_column("problems", "draft_predicate")
    op.drop_column("problems", "known_minimal_counterexample")
    op.drop_column("problems", "why_false")
    op.drop_column("problems", "difficulty")
    op.drop_column("users", "is_admin")
