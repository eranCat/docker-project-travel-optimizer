from models.user import User
from aco_routing import ACO, Graph  # Using the aco_routing library

class ACOInterface:
    def __init__(self, user: User):
        self.user = user

    def process_paths(self, map_data: dict) -> list[str]:
        """
        Process map paths data based on the user's interests using Ant Colony Optimization (ACO).
        
        Args:
            map_data (dict): A dictionary representing the map and paths data.

        Returns:
            list[str]: A list of optimized paths based on the user's interests.
        """
        # Convert map_data into a graph representation
        graph = Graph()
        for path, details in map_data.items():
            graph.add_edge(details['start'], details['end'], weight=details['weight'])

        # Initialize the ACO algorithm
        aco = ACO(ant_count=10, alpha=1.0, beta=2.0, evaporation_rate=0.5, iterations=50)

        # Run the ACO algorithm to find optimized paths
        optimized_path, _ = aco.solve(graph, start=self.user.location, end=self.user.destination)

        return optimized_path
