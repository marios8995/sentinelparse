# Sentinel Probe 📡

A hardware monitoring solution that bridges the gap between low-level system metrics and a modern web interface.

### 🛠️ The Stack
- **Backend:** Python & C++ for data extraction.
- **Database:** SQLite3 for persistent logging of system stats.
- **Frontend:** React (TypeScript) for real-time visualization.

### 🚀 Key Features
- **Real-time Monitoring:** Tracks CPU usage, RAM allocation, Disk I/O, and Network traffic.
- **Multiplatform:** Works on Windows and Linux systems.

### 🔧 Setup & Usage
1. Initial Setup

Clone the repository and run the setup command to compile the C++ probe and install local dependencies:

    Windows: winget install Microsoft.VisualStudio.2022.Community CMake.CMake Python.Python.3 OpenJS.NodeJS

    Debian / Ubuntu: sudo apt install -y build-essential cmake python3-venv nodejs npm

    Arch: sudo pacman -S --needed base-devel cmake python nodejs npm

    Fedora: sudo dnf install gcc-c++ cmake python3 nodejs npm

    openSUSE: sudo zypper install -t pattern devel_basis && sudo zypper install cmake python3 nodejs npm

    Void: sudo xbps-install -S base-devel cmake python3 nodejs

    Nix (Shell): nix-shell -p cmake gcc python3 nodejs

After that, run the sentinel script:

    Windows: Right-click Sentinel.bat and Run as Administrator, then select option [1].

    Linux: Run chmod +x sentinel.sh scripts/*.sh then execute ./sentinel.sh and select option [1].

2. Start Services

Launch the background telemetry services (Collector, API, and Dashboard).

    Windows: Run Sentinel.bat and select option [2].

    Linux: Run ./sentinel.sh and select option [2].

3. Access the Dashboard

Once the services are active, the dashboard is available at:

    Local: http://localhost:5173

    Network/Phone: The start script will print your local IP (e.g., http://192.168.1.50:5173).

4. Stop Services

To terminate all background processes (Python, Node, and the C++ Probe):

    Windows: Run Sentinel.bat and select option [3].

    Linux: Run ./sentinel.sh and select option [3].

*Built as a deep dive into full-stack integration and system-level telemetry.*
