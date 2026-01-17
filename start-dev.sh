#!/bin/bash
#
# CareerHarvester Development Server Startup Script
# Run this script to start both frontend and backend servers
#

set -e

PROJECT_ROOT="/home/biguser/projects/CareerHarvester"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CareerHarvester Development Server   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get WSL IP
WSL_IP=$(hostname -I | awk '{print $1}')
echo -e "${YELLOW}Your WSL IP: ${NC}${WSL_IP}"
echo ""

# Check if .env exists for backend
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}Warning: No .env file found in backend. Creating from example...${NC}"
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo -e "${YELLOW}Please edit $BACKEND_DIR/.env and add your OPENAI_API_KEY${NC}"
    fi
fi

# Kill any existing processes on ports 3000 and 5000
echo "Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Backend
echo -e "${GREEN}Starting Backend Server...${NC}"
cd "$BACKEND_DIR"
source .venv/bin/activate
python app.py &
BACKEND_PID=$!
sleep 2

# Start Frontend
echo -e "${GREEN}Starting Frontend Server...${NC}"
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
sleep 3

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  ✓ Servers Started Successfully!     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Access from Windows browser:${NC}"
echo ""
echo -e "  Frontend: ${GREEN}http://${WSL_IP}:3000${NC}"
echo -e "  Backend:  ${GREEN}http://${WSL_IP}:5000${NC}"
echo ""
echo -e "${YELLOW}Or run this in Windows PowerShell (Admin):${NC}"
echo ""
echo -e "  netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=${WSL_IP}"
echo -e "  netsh interface portproxy add v4tov4 listenport=5000 listenaddress=0.0.0.0 connectport=5000 connectaddress=${WSL_IP}"
echo ""
echo -e "  Then use: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"
echo ""

# Trap Ctrl+C to cleanup
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for processes
wait
