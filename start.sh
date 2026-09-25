#!/usr/bin/env bash
set -euo pipefail

echo "=== EGF Structural Suite — HF Space starting ==="

# 1. Virtual framebuffer
echo "Starting Xvfb :99 ..."
Xvfb :99 -screen 0 1400x900x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!
sleep 2

# 2. Export display
export DISPLAY=:99

# 3. Start the Tauri app
echo "Starting EGF Structural Suite ..."
/usr/local/bin/egf-structural-suite &
APP_PID=$!

# 4. Wait for app window
sleep 5

# 5. VNC server (loopback only)
echo "Starting x11vnc on :5900 ..."
x11vnc -display :99 -forever -shared -rfbport 5900 -nopw -quiet &
VNC_PID=$!

# 6. noVNC on HF's port 7860
echo "Starting noVNC/websockify on :7860 ..."
websockify --web=/usr/share/novnc/ 7860 localhost:5900 &
WS_PID=$!

echo "=== Ready — open the Space to interact ==="

# Keep container alive; restart app if it crashes
while true; do
    if ! kill -0 "$APP_PID" 2>/dev/null; then
        echo "App exited — restarting..."
        /usr/local/bin/egf-structural-suite &
        APP_PID=$!
    fi
    sleep 5
done
