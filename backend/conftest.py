"""
Pytest configuration and test isolation fixtures for CaseFlow backend.
"""

import os
import tempfile
import pytest

# Ensure all backend pytest runs use an isolated temporary SQLite database
_test_db_fd, _test_db_path = tempfile.mkstemp(suffix="_caseflow_test.db")
os.close(_test_db_fd)
os.environ["CASEFLOW_DB_PATH"] = _test_db_path


@pytest.fixture
def anyio_backend():
    return 'asyncio'
