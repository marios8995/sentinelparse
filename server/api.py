from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.get_data import get_data_by_id, get_latest_data, get_historical_raw_data, get_latest_aggregate_data, get_historical_aggregate_data

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

@app.get("/api/latest/raw")
async def latest_snapshot():
    return get_latest_data()

@app.get("/api/latest/hourly")
async def latest_snapshot_hourly():
    return get_latest_aggregate_data("hourly")

@app.get("/api/latest/daily")
async def latest_snapshot_daily():
    return get_latest_aggregate_data("daily")

@app.get("/api/latest/monthly")
async def latest_snapshot_monthly():
    return get_latest_aggregate_data("monthly")

@app.get("/api/latest/yearly")
async def latest_snapshot_yearly():
    return get_latest_aggregate_data("yearly")

@app.get("/api/historical/raw")
async def historical_snapshots_raw():
    return get_historical_raw_data(24)

@app.get("/api/historical/hourly")
async def historical_snapshots_hourly():
    return get_historical_aggregate_data("hourly", 10)

@app.get("/api/historical/daily")
async def historical_snapshots_daily():
    return get_historical_aggregate_data("daily", 30)

@app.get("/api/historical/monthly")
async def historical_snapshots_monthly():
    return get_historical_aggregate_data("monthly", 12)

@app.get("/api/historical/yearly")
async def historical_snapshots_yearly():
    return get_historical_aggregate_data("yearly", 10)
