#!/bin/bash

clear

kill_ports() {
    local ports=("$@")
    for port in "${ports[@]}"; do
        echo "Checking for processes running on port $port..."
        pid=$(lsof -t -i:$port)
        if [ -n "$pid" ]; then
            echo "Killing process $pid on port $port..."
            kill -9 $pid
        else
            echo "No process running on port $port."
        fi
    done
}

# Kill any processes running on the ports we need
kill_ports 3000 3001 8000

# Create data directory if it doesn't exist
mkdir -p server/data

# Activate virtual environment
echo "Activating virtual environment..."
source server/venv/bin/activate

# Start the FastAPI server for FAISS
echo "Starting FastAPI server for FAISS..."
cd server
uvicorn rag_server:app --host 0.0.0.0 --port 8000 --reload &
cd ..

# Give the FastAPI server time to start
echo "Waiting for FastAPI server to initialize..."
sleep 8

# Start the Node.js server
echo "Starting Node.js server..."
cd server
npm start &
cd ..

echo "Waiting for Node.js server to start..."
sleep 5

# Start the React app
echo "Starting React app..."
cd client
npm start &
cd ..

echo "All components are running!"
echo "Access the application at http://localhost:3000"

# Wait for user's input to stop the servers
read -p "Press [ENTER] to stop the servers..."

# Stop the servers
echo "Stopping servers..."
pkill -f "uvicorn rag_server:app"
pkill -f "node server/server.js"
pkill -f "react-scripts start"

# Deactivate virtual environment
echo "Deactivating virtual environment..."
deactivate

echo "All components stopped."
