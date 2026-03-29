from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.get_data import get_data_by_id, get_latest_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/api/get")
async def get_snapshot(db_id: int = 0):
    return get_data_by_id(db_id)

@app.get("/api/latest")
async def latest_snapshot():
    return get_latest_data()
