from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from config import settings
from models.user import User

engine = create_engine(settings.database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_all_users(db: Session):
    return db.query(User).all()


def create_user(db: Session, name: str, email: str):
    new_user = User(name=name, email=email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
