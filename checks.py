"""
checks.py – SQLite-backed store for data items that need to be revisited.

Each check record has:
  id          – auto-increment primary key
  file_id     – source document ID (matches the basename used throughout the app)
  row         – 0-based row index in the document data table
  col         – 0-based column index in the document data table
  error_text  – human-readable description of the problem
  created_at  – ISO-8601 timestamp (UTC) set at insertion time
"""

import sqlite3
import datetime
import os

DB_PATH = os.environ.get('CHECKS_DB_PATH', 'checks.db')


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the checks table if it does not already exist."""
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS checks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id    TEXT    NOT NULL,
                row        INTEGER NOT NULL,
                col        INTEGER NOT NULL,
                error_text TEXT    NOT NULL,
                created_at TEXT    NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_checks_file_id ON checks(file_id)")
        conn.commit()


def _row_to_dict(row):
    return dict(row)


def get_checks(file_id=None):
    """
    Return all check records, optionally filtered by file_id.
    Returns a list of dicts.
    """
    with _connect() as conn:
        if file_id is not None:
            rows = conn.execute(
                "SELECT * FROM checks WHERE file_id = ? ORDER BY created_at",
                (file_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM checks ORDER BY file_id, row, col"
            ).fetchall()
    return [_row_to_dict(r) for r in rows]


def add_check(file_id, row, col, error_text):
    """
    Insert a new check record.
    Returns the newly created record as a dict.
    """
    created_at = datetime.datetime.utcnow().isoformat() + 'Z'
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO checks (file_id, row, col, error_text, created_at) VALUES (?, ?, ?, ?, ?)",
            (file_id, row, col, error_text, created_at)
        )
        conn.commit()
        new_id = cur.lastrowid
        row_obj = conn.execute("SELECT * FROM checks WHERE id = ?", (new_id,)).fetchone()
    return _row_to_dict(row_obj)


def remove_check(check_id):
    """
    Delete a check record by id.
    Returns True if a row was deleted, False if no such id existed.
    """
    with _connect() as conn:
        cur = conn.execute("DELETE FROM checks WHERE id = ?", (check_id,))
        conn.commit()
    return cur.rowcount > 0
