"""Regression coverage for repair of certificates created before revision 015."""
import importlib.util
from pathlib import Path
import uuid

from alembic.migration import MigrationContext
from alembic.operations import Operations
import sqlalchemy as sa


def _load_migration(name: str):
    path = Path(__file__).parents[1] / "alembic" / "versions" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_populated_014_proofs_are_repaired_by_017_without_fabricating_start(engine):
    migration_015 = _load_migration("015_attack_finalization_integrity")
    migration_017 = _load_migration("017_attack_proof_repair")
    legacy_id = uuid.uuid4()
    terminal_id = uuid.uuid4()
    valid_id = uuid.uuid4()
    account_id = uuid.uuid4()

    with engine.begin() as connection:
        connection.exec_driver_sql("""
            CREATE TEMP TABLE attacks (
                id uuid PRIMARY KEY,
                status varchar(20) NOT NULL,
                resolution_proof_at timestamptz,
                resolution_proof_generation integer,
                resolution_generation integer,
                resolution_state varchar(24),
                resolution_account_id uuid,
                resolution_requested_at timestamptz,
                resolution_not_before timestamptz,
                resolution_abandoned boolean NOT NULL DEFAULT false
            ) ON COMMIT DROP
        """)
        connection.exec_driver_sql("""
            CREATE TEMP TABLE cf_sync_checkpoints (
                id uuid PRIMARY KEY,
                judge_account_id uuid,
                finalization_attack_id uuid,
                finalization_not_before timestamptz,
                finalization_generation integer,
                head_scan_offset integer,
                head_scan_max_submission_id integer,
                head_scan_generation integer,
                head_scan_started_at timestamptz,
                head_status varchar(20),
                revision integer NOT NULL
            ) ON COMMIT DROP
        """)
        connection.execute(sa.text("""
            INSERT INTO attacks
                (id, status, resolution_proof_at, resolution_proof_generation,
                 resolution_generation, resolution_state, resolution_account_id)
            VALUES
                (:legacy, 'in_progress', now(), 4, 4, 'proof_complete', :account),
                (:terminal, 'resolved', now(), 2, 2, 'proof_complete', :account),
                (:valid, 'in_progress', now(), 7, 7, 'proof_complete', :account)
        """), {"legacy": legacy_id, "terminal": terminal_id, "valid": valid_id, "account": account_id})
        connection.execute(sa.text("""
            INSERT INTO cf_sync_checkpoints
                (id, judge_account_id, finalization_attack_id,
                 finalization_not_before, finalization_generation, head_scan_offset,
                 head_scan_max_submission_id, head_scan_generation,
                 head_scan_started_at, head_status, revision)
            VALUES
                (:id, :account, :legacy, now(), 4, 5, 99, 4, now(), 'in_progress', 8)
        """), {"id": uuid.uuid4(), "account": account_id, "legacy": legacy_id})

        operations = Operations.context(MigrationContext.configure(connection))
        with operations:
            migration_015.upgrade()
            # Revision 015 added this column nullable; old 014 proof rows
            # therefore carry no verifiable scan start.
            connection.execute(sa.text("""
                UPDATE attacks SET resolution_proof_started_at = now()
                WHERE id = :valid
            """), {"valid": valid_id})
            migration_017.upgrade()

        repaired = connection.execute(sa.text("""
            SELECT resolution_proof_at, resolution_proof_started_at,
                   resolution_proof_generation, resolution_generation,
                   resolution_state
            FROM attacks WHERE id = :id
        """), {"id": legacy_id}).one()
        assert repaired == (None, None, None, None, "queued")

        terminal = connection.execute(sa.text("""
            SELECT resolution_proof_at, resolution_proof_started_at,
                   resolution_proof_generation, resolution_generation,
                   resolution_state
            FROM attacks WHERE id = :id
        """), {"id": terminal_id}).one()
        assert terminal[0] is not None
        assert terminal[2:] == (2, 2, "proof_complete")

        valid = connection.execute(sa.text("""
            SELECT resolution_proof_at, resolution_proof_started_at,
                   resolution_proof_generation, resolution_generation,
                   resolution_state
            FROM attacks WHERE id = :id
        """), {"id": valid_id}).one()
        assert valid[0] is not None and valid[1] is not None
        assert valid[2:] == (7, 7, "proof_complete")

        checkpoint = connection.execute(sa.text("""
            SELECT finalization_attack_id, finalization_not_before,
                   finalization_generation, head_scan_offset,
                   head_scan_max_submission_id, head_scan_generation,
                   head_scan_started_at, head_status, revision
            FROM cf_sync_checkpoints
        """)).one()
        assert checkpoint == (None, None, None, 1, None, None, None, "complete", 9)
