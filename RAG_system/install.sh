#!/bin/bash

echo "=== Installing Dependencies ==="

# 1. Create and activate virtual environment if not already created
if [ ! -d "server/venv" ]; then
    echo "Creating virtual environment..."
    cd server
    python3.12 -m venv venv
    cd ..
fi

echo "Activating virtual environment..."
source server/venv/bin/activate

# 2. Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# 3. Install Python dependencies from requirements.txt
echo "Installing Python dependencies..."
cd server
pip install --upgrade -r requirements.txt

# 4. Ensure uvicorn is installed and up-to-date
echo "Upgrading uvicorn..."
pip install --upgrade uvicorn
cd ..

# 5. Install dependencies for the client and server (Node.js side)
echo "Installing Node.js dependencies (client + server)..."
cd client
npm install
cd ../server
npm install
cd ..

# 6. Deactivate virtual environment
echo "Deactivating virtual environment..."
deactivate

echo "=== Installation completed successfully ==="
