#!/bin/bash

clear

kill_ports() {
    local ports=("$@")
    for port in "${ports[@]}"; do
        echo "Checking for processes running on port $port..."
        pid=$(lsof -t -i:$port)
        if [ -n "$pid" ]; then
            echo "Killing process $pid on port $port..."
            kill -9 "$pid"
        else
            echo "No process running on port $port."
        fi
    done
}

# 1. Kill any processes running on these ports
kill_ports 3000 3001 8000

# 2. Create data directory if it doesn't exist
mkdir -p server/data

# 3. Activate virtual environment
echo "Activating virtual environment..."
source server/venv/bin/activate

# 4. Start the FastAPI (RAG) server in the background
echo "Starting FastAPI server for RAG..."
cd server
uvicorn rag_server:app --host 0.0.0.0 --port 8000 --reload &
cd ..

echo "Waiting for FastAPI server to initialize..."
sleep 8

# 5. Start the Node.js server in the background
echo "Starting Node.js server..."
cd server
npm start &
cd ..

echo "Waiting for Node.js server to start..."
sleep 5

# 6. Start the React app in the background
echo "Starting React app..."
cd client
npm start &
cd ..

echo "All components are running!"
echo "Access the application at http://localhost:3000"

# 7. Wait for user input to stop everything
read -p "Press [ENTER] to stop the servers..."

echo "Stopping servers..."
pkill -f "uvicorn rag_server:app"
pkill -f "node server/server.js"
pkill -f "react-scripts start"

# 8. Deactivate virtual environment
echo "Deactivating virtual environment..."
deactivate

echo "All components stopped."
