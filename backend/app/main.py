from fastapi import FastAPI, HTTPException, Request
from postgres_dao import PostgresDAO, UserModel
from settings import settings

app = FastAPI(title=settings.PROJECT_NAME)

dao = PostgresDAO(settings.DATABASE_URL)

@app.get("/")
def root():
    return {"message": "Welcome to the Travel Itinerary Optimizer API!"}

@app.post("/users", status_code=201)
async def create_user(request: Request):
    """
    Create a new user and store it in the database using SQLAlchemy.
    """
    user_data = await request.json()
    required_fields = ["age", "interests", "dislikes", "location", "destination"]
    for field in required_fields:
        if field not in user_data:
            raise HTTPException(status_code=400, detail=f"Missing field: {field}")
    
    # Convert list fields to comma-separated strings if necessary
    interests = (
        ",".join(user_data["interests"]) 
        if isinstance(user_data["interests"], list) 
        else user_data["interests"]
    )
    dislikes = (
        ",".join(user_data["dislikes"]) 
        if isinstance(user_data["dislikes"], list) 
        else user_data["dislikes"]
    )

    # Create a SQLAlchemy UserModel instance
    user_model = UserModel(
        age=user_data["age"],
        interests=interests,
        dislikes=dislikes,
        location=user_data["location"],
        destination=user_data["destination"]
    )
    
    user_id = dao.save_user(user_model)
    return {"message": "User created successfully", "user_id": user_id}

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    """
    Retrieve a user from the database by ID.
    """
    user_model = dao.get_user(user_id)
    if not user_model:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Manually build a dictionary response from the SQLAlchemy model
    return {
        "id": user_model.id,
        "age": user_model.age,
        "interests": user_model.interests.split(","),
        "dislikes": user_model.dislikes.split(","),
        "location": user_model.location,
        "destination": user_model.destination
    }

@app.get("/users")
def get_all_users():
    """
    Retrieve all users from the database.
    """
    user_models = dao.get_all_users()
    users = []
    for user_model in user_models:
        users.append({
            "id": user_model.id,
            "age": user_model.age,
            "interests": user_model.interests.split(","),
            "dislikes": user_model.dislikes.split(","),
            "location": user_model.location,
            "destination": user_model.destination
        })
    return users


# @app.put("/users/{user_id}")
# async def update_user(user_id: int, request: Request):
#     """
#     Update an existing user in the database.
#     """
#     user_data = await request.json()
#     required_fields = ["age", "interests", "dislikes", "location", "destination"]
#     for field in required_fields:
#         if field not in user_data:
#             raise HTTPException(status_code=400, detail=f"Missing field: {field}")
#
#     session = dao.Session()
#     try:
#         user_model = session.query(UserModel).filter_by(id=user_id).first()
#         if not user_model:
#             raise HTTPException(status_code=404, detail="User not found")
#
#         # Update the fields
#         user_model.age = user_data["age"]
#         user_model.interests = ",".join(user_data["interests"]) if isinstance(user_data["interests"], list) else user_data["interests"]
#         user_model.dislikes = ",".join(user_data["dislikes"]) if isinstance(user_data["dislikes"], list) else user_data["dislikes"]
#         user_model.location = user_data["location"]
#         user_model.destination = user_data["destination"]
#
#         session.commit()
#         session.refresh(user_model)
#         return {"message": "User updated successfully", "user_id": user_id}
#     finally:
#         session.close()