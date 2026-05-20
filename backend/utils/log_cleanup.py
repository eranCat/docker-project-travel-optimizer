import logging
from pathlib import Path

LOG_DIR = Path(__file__).parent.parent.parent / "logs"


def cleanup_logs():
    """Delete all log files."""
    log_dir = LOG_DIR
    if not log_dir.exists():
        return

    for log_file in log_dir.glob("*.log"):
        try:
            log_file.unlink()
            logging.debug(f"Deleted log: {log_file.name}")
        except Exception as e:
            logging.warning(f"Failed to delete {log_file.name}: {e}")
