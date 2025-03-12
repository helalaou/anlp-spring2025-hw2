#!/bin/bash

echo "=== Pittsburgh & CMU Knowledge Base - Deployment Script ==="
echo ""
echo "This script will install all dependencies and then start the application."
echo ""

# Make sure install.sh and run.sh are executable
chmod +x install.sh
chmod +x run.sh

# STEP 1: Install dependencies
echo "=== STEP 1: Installing dependencies ==="
./install.sh

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "Installation failed. Please check the logs above for errors."
    exit 1
fi

# STEP 2: Run the application
echo ""
echo "=== STEP 2: Running the application ==="
./run.sh

# When run.sh ends (user presses ENTER), deployment is done
echo "Deployment complete and application stopped."
