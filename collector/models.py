from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Snapshot(Base):
    __tablename__ = 'snapshots'

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.now)

    system_name = Column(String)
    os_version = Column(String)
    uptime = Column(String)

    cpu_model = Column(String)
    cpu_overall = Column(Float)
    cpu_temp = Column(Float)

    ram_total = Column(Integer)
    ram_used = Column(Integer)
    ram_usage = Column(Float)

    net_down = Column(Integer)
    net_up = Column(Integer)

    cpu_cores = relationship("CoreUsage", back_populates="snapshot", cascade="all, delete-orphan")
    disks = relationship("DiskInfo", back_populates="snapshot", cascade="all, delete-orphan")

class CoreUsage(Base):
    __tablename__ = 'core_usage'

    id = Column(Integer, primary_key=True)
    core_index = Column(Integer)
    usage_percent = Column(Float)

    snapshot_id = Column(Integer, ForeignKey('snapshots.id'))
    snapshot = relationship("Snapshot", back_populates="cpu_cores")


class DiskInfo(Base):
    __tablename__ = 'disk_info'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    read_speed = Column(Float)
    write_speed = Column(Float)
    is_removable = Column(Boolean)

    snapshot_id = Column(Integer, ForeignKey('snapshots.id'))
    snapshot = relationship("Snapshot", back_populates="disks")

    partitions = relationship("PartitionInfo", back_populates="disk", cascade="all, delete-orphan")

class PartitionInfo(Base):
    __tablename__ = 'partition_info'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    device = Column(String)
    mount_point = Column(String)
    total_bytes = Column(Integer)
    free_bytes = Column(Integer)
    usage_percent = Column(Float)

    disk_id = Column(Integer, ForeignKey('disk_info.id'))
    disk = relationship("DiskInfo", back_populates="partitions")
