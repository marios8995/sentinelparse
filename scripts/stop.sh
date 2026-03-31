#!/bin/bash
echo "Stopping Sentinel Services..."

pkill -f "collector/main.py"
pkill -f "uvicorn server.api:app"
pkill -f "node"
pkill -f "SentinelProbe"

echo "All services terminated."