#!/bin/bash
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
ROOT_PATH=$(dirname "$SCRIPT_DIR")
cd "$ROOT_PATH"

LOCAL_IP=$(hostname -i | awk '{print $1}')
export DATABASE_URL="sqlite:///$ROOT_PATH/databases/sentinel.db"

echo "Starting Sentinel Services in background..."

./.venv/bin/python collector/main.py > /dev/null 2>&1 & disown
./.venv/bin/python -m uvicorn server.api:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 & disown
cd dashboard && npm run dev -- --host > /dev/null 2>&1 & disown

echo "------------------------------------------------"
echo "SENTINEL ACTIVE (Linux)"
echo "Local: http://localhost:5173"
echo "Network: http://$LOCAL_IP:5173"
echo "------------------------------------------------"