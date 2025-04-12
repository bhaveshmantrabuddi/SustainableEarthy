#!/bin/bash

echo "EcoFinance - Sustainable Finance Tracker"
echo "========================================"
echo ""
echo "Choose which backend to run:"
echo "1) Node.js/Express (Default)"
echo "2) Python/Flask"
echo ""
read -p "Enter your choice (1-2): " choice

case $choice in
    1)
        echo "Starting Node.js/Express backend..."
        npm run dev
        ;;
    2)
        echo "Starting Python/Flask backend..."
        echo "Checking Python environment..."
        
        # Check if Python packages are installed
        if ! pip list | grep -q "flask"; then
            echo "Installing required Python packages..."
            cd server_python
            pip install -r requirements.txt
            cd ..
        fi
        
        # Create .env file if it doesn't exist
        if [ ! -f "server_python/.env" ]; then
            echo "Creating .env file..."
            cp server_python/.env.example server_python/.env
            echo "SESSION_SECRET=$(openssl rand -hex 16)" > server_python/.env
            echo "FLASK_ENV=development" >> server_python/.env
        fi
        
        # Run the Flask application
        cd server_python
        python run.py
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac