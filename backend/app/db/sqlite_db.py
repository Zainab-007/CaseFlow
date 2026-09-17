"""
CaseFlow SQLite Storage Layer
SIH26047 — AI-Powered Patient Case-Taking Software

Provides lightweight, robust SQLite persistence for canonical patient records
and document metadata using Python's built-in sqlite3 library.
"""

import os
import json
import sqlite3
from typing import Dict, Any, Optional
from datetime import datetime


def get_default_db_path() -> str:
    """Returns absolute path to default CaseFlow SQLite database file."""
    if os.getenv("CASEFLOW_DB_PATH"):
        return os.path.abspath(os.getenv("CASEFLOW_DB_PATH"))
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(base_dir, "data", "caseflow.db")


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Creates a new connection to the SQLite database, ensuring parent directory exists."""
    path = db_path or get_default_db_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    conn = sqlite3.connect(path, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[str] = None):
    """
    Initializes SQLite tables for patient records and document metadata if they do not exist.
    """
    path = db_path or get_default_db_path()
    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                document_id TEXT PRIMARY KEY,
                patient_id TEXT NOT NULL,
                data TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        conn.commit()


# =========================================================
# PATIENTS STORAGE OPERATIONS
# =========================================================

def save_patient_to_db(patient_dict: Dict[str, Any], db_path: Optional[str] = None):
    """
    Persists a canonical patient dictionary to SQLite.
    Inserts a new record or updates an existing record based on patient ID.
    """
    if not patient_dict or "id" not in patient_dict:
        return

    patient_id = str(patient_dict["id"])
    data_json = json.dumps(patient_dict, ensure_ascii=False)
    updated_at = datetime.now().isoformat()
    path = db_path or get_default_db_path()

    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO patients (id, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                data = excluded.data,
                updated_at = excluded.updated_at;
        """, (patient_id, data_json, updated_at))
        conn.commit()


def load_all_patients_from_db(db_path: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    """
    Retrieves all persisted patient records from SQLite.
    Returns a dictionary mapping patient_id -> canonical patient dict.
    """
    path = db_path or get_default_db_path()
    init_db(path)
    patients = {}
    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, data FROM patients ORDER BY id ASC")
        rows = cursor.fetchall()
        for row in rows:
            try:
                patient_data = json.loads(row["data"])
                patients[row["id"]] = patient_data
            except Exception as e:
                print(f"[SQLite] Error parsing patient record {row['id']}: {e}")
    return patients


def load_patient_from_db(patient_id: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieves a single patient record by ID from SQLite."""
    path = db_path or get_default_db_path()
    init_db(path)
    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT data FROM patients WHERE id = ?", (patient_id,))
        row = cursor.fetchone()
        if row:
            try:
                return json.loads(row["data"])
            except Exception as e:
                print(f"[SQLite] Error parsing patient record {patient_id}: {e}")
    return None


def delete_patient_from_db(patient_id: str, db_path: Optional[str] = None) -> bool:
    """Deletes a patient record by ID from SQLite."""
    path = db_path or get_default_db_path()
    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
        conn.commit()
        return cursor.rowcount > 0


# =========================================================
# DOCUMENTS STORAGE OPERATIONS
# =========================================================

def save_document_to_db(doc_dict: Dict[str, Any], db_path: Optional[str] = None):
    """
    Persists a medical document dictionary to SQLite.
    Inserts a new record or updates an existing record based on document_id.
    """
    if not doc_dict or "document_id" not in doc_dict:
        return

    doc_id = str(doc_dict["document_id"])
    patient_id = str(doc_dict.get("patient_id", ""))
    data_json = json.dumps(doc_dict, ensure_ascii=False)
    updated_at = datetime.now().isoformat()
    path = db_path or get_default_db_path()

    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO documents (document_id, patient_id, data, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(document_id) DO UPDATE SET
                patient_id = excluded.patient_id,
                data = excluded.data,
                updated_at = excluded.updated_at;
        """, (doc_id, patient_id, data_json, updated_at))
        conn.commit()


def load_all_documents_from_db(db_path: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    """
    Retrieves all persisted document records from SQLite.
    Returns a dictionary mapping document_id -> document dict.
    """
    path = db_path or get_default_db_path()
    init_db(path)
    documents = {}
    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT document_id, data FROM documents ORDER BY document_id ASC")
        rows = cursor.fetchall()
        for row in rows:
            try:
                doc_data = json.loads(row["data"])
                documents[row["document_id"]] = doc_data
            except Exception as e:
                print(f"[SQLite] Error parsing document record {row['document_id']}: {e}")
    return documents


def delete_document_from_db(document_id: str, db_path: Optional[str] = None) -> bool:
    """Deletes a document record by document_id from SQLite."""
    path = db_path or get_default_db_path()
    with get_connection(path) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE document_id = ?", (document_id,))
        conn.commit()
        return cursor.rowcount > 0
