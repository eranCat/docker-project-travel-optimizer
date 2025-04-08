from fastapi import FastAPI, Depends
from app.models import PathRequest, PathResponse
from app.aco_engine import ACOEngine
from app.db import SessionLocal, engine, Base
from app.db_models import PathResult
from sqlalchemy.orm import Session

# Create DB tables (for production, use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/find-path/", response_model=PathResponse)
def find_path(request: PathRequest, db: Session = Depends(get_db)):
    engine_instance = ACOEngine(request)
    path, distance = engine_instance.run()

    # Save result to DB; here, computed_path is stored as a CSV string:
    computed_path = ",".join(path)
    db_result = PathResult(
        start=request.start,
        end=request.end,
        computed_path=computed_path,
        total_distance=distance
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)

    return PathResponse(optimal_path=path, total_distance=distance)
