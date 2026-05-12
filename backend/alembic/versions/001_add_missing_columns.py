"""add missing columns (deleted_at, member_id, deduction_type)

Revision ID: 001
Revises:
Create Date: 2026-05-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # members.deleted_at — 탈퇴 시각 (소프트 딜리트 + 30일 후 영구 삭제용)
    op.add_column(
        "members",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # business_requests.member_id — 신청한 사장 추적
    op.add_column(
        "business_requests",
        sa.Column("member_id", sa.BigInteger(), nullable=True),
    )
    op.create_foreign_key(
        "fk_business_requests_member_id",
        "business_requests", "members",
        ["member_id"], ["id"],
    )

    # staff_contracts.deduction_type — 공제 값이 비율인지 고정금액인지 명시
    op.add_column(
        "staff_contracts",
        sa.Column(
            "deduction_type",
            sa.String(10),
            server_default="percent",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("staff_contracts", "deduction_type")
    op.drop_constraint("fk_business_requests_member_id", "business_requests", type_="foreignkey")
    op.drop_column("business_requests", "member_id")
    op.drop_column("members", "deleted_at")
