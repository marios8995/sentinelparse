from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from models import Base, Snapshot, CoreUsage, DiskInfo, PartitionInfo, AggregateSnap, DiskInfoAgr, PartitionInfoAgr
import time
import os
from datetime import datetime, timedelta

os.makedirs("databases", exist_ok=True)
DB_PATH = "sqlite:///databases/sentinel.db"
engine = create_engine(DB_PATH)
DB_HOURLY_PATH = "sqlite:///databases/sentinel_hourly.db"
engine_hourly = create_engine(DB_HOURLY_PATH)
DB_DAILY_PATH = "sqlite:///databases/sentinel_daily.db"
engine_daily = create_engine(DB_DAILY_PATH)
DB_MONTHLY_PATH = "sqlite:///databases/sentinel_monthly.db"
engine_monthly = create_engine(DB_MONTHLY_PATH)
DB_YEARLY_PATH = "sqlite:///databases/sentinel_yearly.db"
engine_yearly = create_engine(DB_YEARLY_PATH)

def apply_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


for eng in [engine, engine_hourly, engine_daily, engine_monthly, engine_yearly]:
    event.listen(eng, "connect", apply_pragma)
    Base.metadata.create_all(eng)

Session = sessionmaker(bind=engine)
SessionHourly = sessionmaker(bind=engine_hourly)
SessionDaily = sessionmaker(bind=engine_daily)
SessionMonthly = sessionmaker(bind=engine_monthly)
SessionYearly = sessionmaker(bind=engine_yearly)

def convert_time(unix_time):
    return datetime.fromtimestamp(unix_time) if unix_time else datetime.now()

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

def _generic_cleanup(session_maker, model, time_delta, label):
    session = session_maker()
    try:
        cutoff_date = datetime.now() - time_delta
        deleted_count = session.query(model).filter(model.timestamp < cutoff_date).delete()
        session.commit()
        if deleted_count > 0:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Cleanup: Deleted {deleted_count} old {label} records.")
    except Exception as e:
        session.rollback()
        print(f"Cleanup failed for {label}: {e}")
    finally:
        session.close()

def cleanup_data_hourly():
    _generic_cleanup(Session, Snapshot, timedelta(hours=1), "raw 10-second")

def cleanup_data_daily():
    _generic_cleanup(SessionHourly, AggregateSnap, timedelta(days=1), "hourly")

def cleanup_data_monthly():
    _generic_cleanup(SessionDaily, AggregateSnap, timedelta(days=30), "daily")

def cleanup_data_yearly():
    _generic_cleanup(SessionMonthly, AggregateSnap, timedelta(days=365), "monthly")


def aggregate_hourly_data():
    session_raw = Session()
    session_hourly = SessionHourly()

    try:
        one_hour_ago = datetime.now() - timedelta(hours=1)
        snapshots = session_raw.query(Snapshot).filter(
            Snapshot.timestamp >= one_hour_ago
        ).order_by(Snapshot.timestamp.asc()).all()

        if not snapshots:
            print(f"[{time.strftime('%H:%M:%S')}] No data to aggregate for the last hour.")
            return

        count = len(snapshots)
        cpu_avg = sum(s.cpu_overall for s in snapshots if s.cpu_overall) / count

        temps = [s.cpu_temp for s in snapshots if s.cpu_temp is not None]
        temp_avg = sum(temps) / len(temps) if temps else 0.0

        ram_avg = sum(s.ram_usage for s in snapshots if s.ram_usage) / count

        net_down_total = sum((s.net_down or 0) * 10 for s in snapshots)
        net_up_total = sum((s.net_up or 0) * 10 for s in snapshots)

        first_snap = snapshots[0]
        last_snap = snapshots[-1]

        hourly_snap = AggregateSnap(
            timestamp=datetime.now(),
            cpu_overall=round(cpu_avg, 2),
            cpu_temp=round(temp_avg, 2),
            ram_usage=round(ram_avg, 2),
            net_down=net_down_total,
            net_up=net_up_total
        )

        start_free_space = {}
        for disk in first_snap.disks:
            for part in disk.partitions:
                if not disk.is_removable:
                    start_free_space[part.name] = part.free_bytes

        for disk in last_snap.disks:
            disk_agr = DiskInfoAgr(name=disk.name)
            for part in disk.partitions:
                if not disk.is_removable:
                    continue

                start_bytes = start_free_space.get(part.name, part.free_bytes)
                bytes_dif = start_bytes - part.free_bytes

                part_agr = PartitionInfoAgr(
                    name=part.name,
                    device=part.device,
                    mount_point=part.mount_point,
                    bytes_dif=bytes_dif
                )
                disk_agr.partitions.append(part_agr)
            hourly_snap.disks.append(disk_agr)

        session_hourly.add(hourly_snap)
        session_hourly.commit()
        print(f"[{time.strftime('%H:%M:%S')}] Hourly aggregation complete. Consolidated {count} rows.")

    except Exception as e:
        session_hourly.rollback()
        print(f"Aggregation failed: {e}")
    finally:
        session_raw.close()
        session_hourly.close()


def _rollup_aggregates(source_session_maker, dest_session_maker, time_delta, label):
    session_source = source_session_maker()
    session_dest = dest_session_maker()

    try:
        cutoff = datetime.now() - time_delta
        snapshots = session_source.query(AggregateSnap).filter(
            AggregateSnap.timestamp >= cutoff
        ).order_by(AggregateSnap.timestamp.asc()).all()

        if not snapshots:
            return

        count = len(snapshots)
        cpu_avg = sum(s.cpu_overall for s in snapshots if s.cpu_overall is not None) / count
        temps = [s.cpu_temp for s in snapshots if s.cpu_temp is not None]
        temp_avg = sum(temps) / len(temps) if temps else 0.0
        ram_avg = sum(s.ram_usage for s in snapshots if s.ram_usage is not None) / count

        net_down_total = sum(s.net_down or 0 for s in snapshots)
        net_up_total = sum(s.net_up or 0 for s in snapshots)

        new_snap = AggregateSnap(
            timestamp=datetime.now(),
            cpu_overall=round(cpu_avg, 2),
            cpu_temp=round(temp_avg, 2),
            ram_usage=round(ram_avg, 2),
            net_down=net_down_total,
            net_up=net_up_total
        )

        disk_data_map = {}
        for snap in snapshots:
            for disk in snap.disks:
                if disk.name not in disk_data_map:
                    disk_data_map[disk.name] = {}
                for part in disk.partitions:
                    if part.name not in disk_data_map[disk.name]:
                        disk_data_map[disk.name][part.name] = {
                            "device": part.device,
                            "mount_point": part.mount_point,
                            "bytes_dif": 0
                        }
                    disk_data_map[disk.name][part.name]["bytes_dif"] += (part.bytes_dif or 0)

        for disk_name, parts in disk_data_map.items():
            disk_agr = DiskInfoAgr(name=disk_name)
            for part_name, part_info in parts.items():
                part_agr = PartitionInfoAgr(
                    name=part_name,
                    device=part_info["device"],
                    mount_point=part_info["mount_point"],
                    bytes_dif=part_info["bytes_dif"]
                )
                disk_agr.partitions.append(part_agr)
            new_snap.disks.append(disk_agr)

        session_dest.add(new_snap)
        session_dest.commit()
        print(f"[{time.strftime('%H:%M:%S')}] {label} rollup complete. Consolidated {count} rows into 1.")

    except Exception as e:
        session_dest.rollback()
        print(f"{label} rollup failed: {e}")
    finally:
        session_source.close()
        session_dest.close()

def aggregate_daily_data():
    _rollup_aggregates(SessionHourly, SessionDaily, timedelta(days=1), "Daily")

def aggregate_monthly_data():
    _rollup_aggregates(SessionDaily, SessionMonthly, timedelta(days=30), "Monthly")

def aggregate_yearly_data():
    _rollup_aggregates(SessionMonthly, SessionYearly, timedelta(days=365), "Yearly")