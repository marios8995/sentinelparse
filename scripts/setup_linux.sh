#!/bin/bash
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
ROOT_PATH=$(dirname "$SCRIPT_DIR")
cd "$ROOT_PATH"

echo "--- SentinelParse Linux Build ---"

REQUIRED_TOOLS=("cmake" "g++" "python3" "npm")
for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v $tool &> /dev/null; then
        echo "ERROR: '$tool' not found. Please check README.md for installation instructions."
        exit 1
    fi
done

echo "[1/3] Compiling C++ Probe..."
mkdir -p probe/build
cmake -S probe -B probe/build
cmake --build probe/build --target SentinelProbe

echo "[2/3] Setting up Python venv..."
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt

echo "[3/3] Installing Dashboard modules..."
cd dashboard && npm install && npm install recharts
cd "$ROOT_PATH"

echo "Setup Complete!"