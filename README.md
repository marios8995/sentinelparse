# Sentinel Probe 📡

A hardware monitoring solution that bridges the gap between low-level system metrics and a modern web interface.

### 🛠️ The Stack
- **Backend:** Python & C++ for data extraction.
- **Database:** SQLite3 for persistent logging of system stats.
- **Frontend:** React (TypeScript) for real-time visualization. *(WIP)*
- **Deployment:** Dockerized for environment consistency. *(WIP)*

### 🚀 Key Features
- **Real-time Monitoring:** Tracks CPU usage, RAM allocation, Disk I/O, and Network traffic.
- **Data Persistence:** Stores historical data to analyze system performance over time.
- **Containerized:** Easily deployable on any Linux-based environment via Docker.

### 🔧 Setup & Usage
1. Clone the repository.
2. Run `docker-compose up` to start the backend and frontend services.
3. Access the dashboard at `localhost:3000`.

*Built as a deep dive into full-stack integration and system-level telemetry.*
