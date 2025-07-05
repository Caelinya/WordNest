"""add created_at to note model

Revision ID: 96d68f4f4226
Revises: bf1ab2092ce2
Create Date: 2025-07-05 22:17:23.825671

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96d68f4f4226'
down_revision: Union[str, Sequence[str], None] = 'bf1ab2092ce2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Step 1: Add the column, allowing nulls
    op.add_column('note', sa.Column('created_at', sa.DateTime(), nullable=True))

    # Step 2: Populate existing rows with the current time
    op.execute('UPDATE note SET created_at = NOW() WHERE created_at IS NULL')

    # Step 3: Alter the column to be NOT NULL
    op.alter_column('note', 'created_at', nullable=False)

    # Create the index for the new column
    op.create_index(op.f('ix_note_created_at'), 'note', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_note_created_at'), table_name='note')
    op.drop_column('note', 'created_at')
