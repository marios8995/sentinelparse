from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from collector.models import Base, Snapshot, CoreUsage, DiskInfo, PartitionInfo
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = f"sqlite:///{BASE_DIR}/collector/databases/sentinel.db"
engine = create_engine(DB_PATH)
Session = sessionmaker(bind=engine)

def data_to_json(data):
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
            {"core_index": core.core_index,
             "usage_percent": core.usage_percent
             } for core in data.cpu_cores ],
        "disks": [
            {"name": disk.name,
             "read_speed": disk.read_speed,
             "write_speed": disk.write_speed,
             "is_removable": disk.is_removable,
             "partitions": [
                 {"name": part.name,
                  "device": part.device,
                  "mount_point": part.mount_point,
                  "total_bytes": part.total_bytes,
                  "free_bytes": part.free_bytes,
                  "usage_percent": part.usage_percent}
                 for part in disk.partitions]
             } for disk in data.disks ]
    }

def get_data_by_id(data_id: int):
    session = Session()
    try:
        data = session.get(Snapshot, data_id)
        if not data:
            return {"error": f"Snapshot {data_id} not found"}
        return data_to_json(data)
    except Exception as e:
        return {"error": str(e)}
    finally:
        session.close()

def get_latest_data():
    session = Session()
    try:
        data = session.query(Snapshot).order_by(Snapshot.timestamp.desc()).first()
        if not data:
            return {"error": f"Database is empty"}
        return data_to_json(data)
    except Exception as e:
        return {"error": str(e)}
    finally:
        session.close()
