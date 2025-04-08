import unittest
from app.aco_engine import ACOEngine
from app.models import PathRequest, Edge

print("✅ Test file is being executed.")

class TestACOEngine(unittest.TestCase):
    def test_run(self):
        print("🚀 Running test_run...")
        request = PathRequest(
            nodes=["A", "B"],
            edges=[Edge(from_node="A", to_node="B", distance=10)],
            start="A",
            end="B"
        )
        engine = ACOEngine(request)
        path, distance = engine.run()

        self.assertEqual(path, ["A", "B"])
        self.assertEqual(distance, 42.0)

if __name__ == "__main__":
    unittest.main()