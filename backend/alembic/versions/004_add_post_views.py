"""add store_community_views table

Revision ID: 004
Revises: 003
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS store_community_views (
            id BIGSERIAL NOT NULL,
            post_id BIGINT NOT NULL,
            employee_id BIGINT NOT NULL,
            viewed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
            PRIMARY KEY (id),
            FOREIGN KEY(employee_id) REFERENCES store_members (id) ON DELETE CASCADE,
            FOREIGN KEY(post_id) REFERENCES store_community (id) ON DELETE CASCADE,
            UNIQUE (post_id, employee_id)
        )
    """)


def downgrade() -> None:
    op.drop_table("store_community_views")
