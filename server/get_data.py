from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from collector.models import (
    Base, Snapshot, CoreUsage, DiskInfo, PartitionInfo,
    AggregateSnap, DiskInfoAgr, PartitionInfoAgr
)
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SESSIONS = {}

def setup_sessions():
    db_configs = {
        "raw": "sentinel.db",
        "hourly": "sentinel_hourly.db",
        "daily": "sentinel_daily.db",
        "monthly": "sentinel_monthly.db",
        "yearly": "sentinel_yearly.db"
    }

    for key, filename in db_configs.items():
        db_path = f"sqlite:///{BASE_DIR}/databases/{filename}"
        engine = create_engine(db_path)
        SESSIONS[key] = sessionmaker(bind=engine)

setup_sessions()

def raw_data_to_json(data):
    return {
        "id": data.id,
        "timestamp": data.timestamp.isoformat() if data.timestamp else None,
        "system_name": data.system_name,
        "os_version": data.os_version,
        "uptime": data.uptime,
        "cpu_model": data.cpu_model,
        "cpu_overall": data.cpu_overall,
        "cpu_temp": data.cpu_temp,
        "ram_total": data.ram_total,
        "ram_used": data.ram_used,
        "ram_usage": data.ram_usage,
        "net_down": data.net_down,
        "net_up": data.net_up,
        "cpu_cores": [
            {
                "core_index": core.core_index,
                "usage_percent": core.usage_percent
            } for core in data.cpu_cores
        ],
        "disks": [
            {
                "name": disk.name,
                "read_speed": disk.read_speed,
                "write_speed": disk.write_speed,
                "is_removable": disk.is_removable,
                "partitions": [
                    {
                        "name": part.name,
                        "device": part.device,
                        "mount_point": part.mount_point,
                        "total_bytes": part.total_bytes,
                        "free_bytes": part.free_bytes,
                        "usage_percent": part.usage_percent
                    } for part in disk.partitions
                ]
            } for disk in data.disks
        ]
    }


def agr_data_to_json(data):
    return {
        "id": data.id,
        "timestamp": data.timestamp.isoformat() if data.timestamp else None,
        "cpu_overall": data.cpu_overall,
        "cpu_temp": data.cpu_temp,
        "ram_usage": data.ram_usage,
        "net_down": data.net_down,
        "net_up": data.net_up,
        "disks": [
            {
                "name": disk.name,
                "partitions": [
                    {
                        "name": part.name,
                        "device": part.device,
                        "mount_point": part.mount_point,
                        "bytes_dif": part.bytes_dif
                    } for part in disk.partitions
                ]
            } for disk in data.disks
        ]
    }

def get_data_by_id(data_id: int):
    session = SESSIONS["raw"]()
    try:
        data = session.get(Snapshot, data_id)
        if not data:
            return {"error": f"Snapshot {data_id} not found"}
        return raw_data_to_json(data)
    except Exception as e:
        return {"error": str(e)}
    finally:
        session.close()


def get_latest_data():
    session = SESSIONS["raw"]()
    try:
        data = session.query(Snapshot).order_by(Snapshot.timestamp.desc()).first()
        if not data:
            return {"error": "Database is empty"}
        return raw_data_to_json(data)
    except Exception as e:
        return {"error": str(e)}
    finally:
        session.close()


def get_historical_raw_data(limit: int = 60):
    session = SESSIONS["raw"]()
    try:
        records = session.query(Snapshot).order_by(Snapshot.timestamp.desc()).limit(limit).all()
        return [raw_data_to_json(data) for data in reversed(records)]
    except Exception as e:
        return {"error": str(e)}
    finally:
        session.close()

def get_latest_aggregate_data(interval: str):
    if interval not in SESSIONS or interval == "raw":
        return {"error": f"Invalid aggregate interval: {interval}"}

    session = SESSIONS[interval]()
    try:
        data = session.query(AggregateSnap).order_by(AggregateSnap.timestamp.desc()).first()
        if not data:
            return {"error": f"{interval.capitalize()} database is empty"}
        return agr_data_to_json(data)
    except Exception as e:
        return {"error": str(e)}
    finally:
        session.close()


def get_historical_aggregate_data(interval: str, limit: int = 10):
    if interval not in SESSIONS or interval == "raw":
        return {"error": f"Invalid aggregate interval: {interval}"}

    session = SESSIONS[interval]()
    try:
        records = session.query(AggregateSnap).order_by(AggregateSnap.timestamp.desc()).limit(limit).all()
        return [agr_data_to_json(data) for data in reversed(records)]
    except Exception as e:
        return {"error": str(e)}
    finally:
        session.close()
