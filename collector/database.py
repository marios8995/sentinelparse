from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from models import Base, Snapshot, CoreUsage, DiskInfo, PartitionInfo
import time
from datetime import datetime, timedelta

DB_PATH = "sqlite:///databases/sentinel.db"
engine = create_engine(DB_PATH)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

def convert_time(unix_time):
    parsed_time = datetime.fromtimestamp(unix_time) if unix_time else datetime.now()

def save_snapshot(data):
    if not data:
        return

    session = Session()
    try:
        snap = Snapshot(
            timestamp=convert_time(data.get('timestamp')),
            system_name=data.get('system_name'),
            os_version=data.get('os_version'),
            uptime=data.get('uptime'),
            cpu_model=data.get('cpu_model'),
            cpu_overall=data.get('cpu'),
            cpu_temp=data.get('temp'),
            ram_total=data.get('ram_total'),
            ram_used=data.get('ram_used'),
            ram_usage=data.get('ram'),
            net_down=data.get('net_download_speed'),
            net_up=data.get('net_upload_speed')
        )

        for i, usage in enumerate(data.get('cpu_cores_usage', [])):
            snap.cpu_cores.append(CoreUsage(core_index=i, usage_percent=usage))

        for disk_data in data.get('disks', []):
            disk = DiskInfo(
                name=disk_data.get('device_name'),
                read_speed=disk_data.get('read_kbps'),
                write_speed=disk_data.get('write_kbps'),
                is_removable=disk_data.get('is_removable')
            )

            for part_data in disk_data.get('partitions', []):
                partition = PartitionInfo(
                    name=part_data.get('name'),
                    device=part_data.get('device'),
                    mount_point=part_data.get('mount_point'),
                    total_bytes=part_data.get('total'),
                    free_bytes=part_data.get('available'),
                    usage_percent=part_data.get('percent_used')
                )
                disk.partitions.append(partition)
            snap.disks.append(disk)
        session.add(snap)
        session.commit()
        print(f"[{time.strftime('%H:%M:%S')}] Snapshot {snap.id} saved successfully.")
    except Exception as e:
        session.rollback()
        print(f"Failed to save snapshot: {e}")
    finally:
        session.close()

def cleanup_data(days_to_keep=7):
    session = Session()
    try:
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        deleted_count = session.query(Snapshot).filter(Snapshot.timestamp < cutoff_date).delete()
        session.commit()
        if deleted_count > 0:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Cleanup: Deleted {deleted_count} old snapshots.")
    except Exception as e:
        session.rollback()
        print(f"Cleanup failed: {e}")
    finally:
        session.close()
