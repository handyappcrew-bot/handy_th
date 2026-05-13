"""add monthly_salary to staff_contracts

Revision ID: 005
Revises: 004
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE staff_contracts
        ADD COLUMN IF NOT EXISTS monthly_salary INTEGER NULL;
    """)


def downgrade():
    op.execute("ALTER TABLE staff_contracts DROP COLUMN IF EXISTS monthly_salary;")
