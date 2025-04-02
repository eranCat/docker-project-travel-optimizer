class User:
    def __init__(self, age: int, interests: list[str], dislikes: list[str], location: str, destination: str):
        self.age = age
        self.interests = interests
        self.dislikes = dislikes
        self.location = location
        self.destination = destination

    def __repr__(self):
        return (
            f"User(age={self.age}, interests={self.interests}, dislikes={self.dislikes}, "
            f"location={self.location}, destination={self.destination})"
        )
