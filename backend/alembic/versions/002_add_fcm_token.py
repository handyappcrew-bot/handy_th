"""add fcm_token to members

Revision ID: 002
Revises: 001
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column("fcm_token", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("members", "fcm_token")
