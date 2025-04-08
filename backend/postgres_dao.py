from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class UserModel(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    age = Column(Integer, nullable=False)
    interests = Column(String, nullable=False)
    dislikes = Column(String, nullable=False)
    location = Column(String, nullable=False)
    destination = Column(String, nullable=False)

class PostgresDAO:
    def __init__(self, db_url: str):
        """
        Initialize the DAO with the database URL.
        """
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def save_user(self, user_model: UserModel) -> int:
        """
        Save a UserModel object to the database.
        Returns the generated user ID.
        """
        session = self.Session()
        try:
            session.add(user_model)
            session.commit()
            session.refresh(user_model)  # To load the generated ID
            return user_model.id
        finally:
            session.close()

    def get_user(self, user_id: int) -> UserModel:
        """
        Retrieve a UserModel object from the database by ID.
        Returns None if the user is not found.
        """
        session = self.Session()
        try:
            return session.query(UserModel).filter_by(id=user_id).first()
        finally:
            session.close()

    def get_all_users(self) -> list:
        session = self.Session()
        try:
            return session.query(UserModel).all()
        finally:
            session.close()

    def close(self):
        """Dispose of the database engine."""
        self.engine.dispose()
