#!/bin/bash

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

# Install Python dependencies from requirements.txt
echo "Installing Python dependencies..."
cd server
pip install --upgrade pip
pip install --upgrade -r requirements.txt

# Ensure uvicorn is installed
pip install --upgrade uvicorn
cd ..

# Install dependencies for the client and server
echo "Installing dependencies for the client and server..."
cd client
npm install
cd ../server 
npm install
cd ..

# Start the RAG server using uvicorn
echo "Starting RAG server..."
cd server
uvicorn rag_server:app --host 127.0.0.1 --port 8000 --reload &
cd ..

# Deactivate virtual environment
echo "Deactivating virtual environment..."
deactivate

echo "Installation and server startup completed."
