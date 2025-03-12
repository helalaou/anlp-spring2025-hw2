#!/bin/bash

echo "=== Installing Dependencies ==="

# Create and activate virtual environment if not already created
if [ ! -d "server/venv" ]; then
    echo "Creating virtual environment..."
    cd server
    python -m venv venv
    cd ..
fi

# Activate virtual environment
echo "Activating virtual environment..."
source server/venv/bin/activate

# Upgrade pip itself first
echo "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies from requirements.txt
echo "Installing Python dependencies..."
cd server
pip install --upgrade -r requirements.txt

# Ensure uvicorn is installed and updated
echo "Upgrading uvicorn..."
pip install --upgrade uvicorn
cd ..

# Install dependencies for the client and server
echo "Installing dependencies for the client and server..."
cd client
npm install
cd ../server 
npm install
cd ..

# Deactivate virtual environment
echo "Deactivating virtual environment..."
deactivate

echo "=== Installation completed successfully ==="
