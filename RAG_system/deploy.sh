#!/bin/bash

echo "=== Pittsburgh & CMU Knowledge Base - Deployment Script ==="
echo ""
echo "This script will install all dependencies and start the application."
echo ""

# Make sure install.sh and run.sh are executable
chmod +x install.sh
chmod +x run.sh

# Run the installation script
echo "=== STEP 1: Installing dependencies ==="
./install.sh

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "Installation failed. Please check the logs above for errors."
    exit 1
fi

echo ""
echo "=== STEP 2: Starting the application ==="
# Run the application
./run.sh

# The script will end when run.sh ends (when the user presses ENTER)
echo "Deployment complete and application stopped." 