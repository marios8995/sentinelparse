from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.get_data import get_latest_data, get_historical_aggregate_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/api/latest/raw")
async def latest_snapshot():
    return get_latest_data()

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
