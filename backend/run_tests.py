import pytest
import sys

print("🧪 Running unit tests...")

exit_code = pytest.main(["-v", "tests/"])

if exit_code != 0:
    print("❌ Tests failed!")
    sys.exit(exit_code)

print("✅ All tests passed!")