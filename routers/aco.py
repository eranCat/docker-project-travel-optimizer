from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_best_path():
    return {"path": ["A", "B", "C"], "cost": 12.5}