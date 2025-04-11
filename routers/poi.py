from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_pois():
    return [{"id": 1, "name": "Eiffel Tower"}]