from fastapi import FastAPI
from server.get_data import get_data_by_id, get_latest_data

app = FastAPI()

@app.get("/api/get")
async def get_snapshot(db_id: int = 0):
    return get_data_by_id(db_id)

@app.get("/api/latest")
async def latest_snapshot():
    return get_latest_data()
