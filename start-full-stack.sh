#!/bin/bash

# DevOps CI/CD Dashboard - Full Stack Startup Script
# This script starts MongoDB, Backend, and Frontend servers

echo "🚀 Starting DevOps CI/CD Dashboard - Full Stack Version"
echo "=================================================="

# Function to check if MongoDB is running
check_mongodb() {
    pgrep -x mongod > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB is already running"
        return 0
    else
        echo "❌ MongoDB is not running"
        return 1
    fi
}

# Function to start MongoDB
start_mongodb() {
    echo "🔧 Starting MongoDB..."
    export PATH="/usr/local/mongodb/bin:$PATH"
    mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
    
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB started successfully"
        sleep 2
        return 0
    else
        echo "❌ Failed to start MongoDB"
        return 1
    fi
}

# Function to check if backend is running
check_backend() {
    pgrep -f "node server-mongodb.js" > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Backend server is already running"
        return 0
    else
        echo "❌ Backend server is not running"
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Server..."
    cd backend
    export PATH="/usr/local/mongodb/bin:$PATH"
    node server-mongodb.js &
    BACKEND_PID=$!
    
    sleep 3
    if ps -p $BACKEND_PID > /dev/null; then
        echo "✅ Backend server started successfully (PID: $BACKEND_PID)"
        echo "📍 Backend URL: http://localhost:5002"
        echo "📍 Health Check: http://localhost:5002/health"
        return 0
    else
        echo "❌ Failed to start backend server"
        return 1
    fi
}

# Function to check if frontend is running
check_frontend() {
    pgrep -f "python3 -m http.server" > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Frontend server is already running"
        return 0
    else
        echo "❌ Frontend server is not running"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo "🔧 Starting Frontend Server..."
    cd ..
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
    
    sleep 2
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "✅ Frontend server started successfully (PID: $FRONTEND_PID)"
        echo "📍 Frontend URL: http://localhost:8000"
        return 0
    else
        echo "❌ Failed to start frontend server"
        return 1
    fi
}

# Main execution
main() {
    # Set up environment
    export PATH="/usr/local/mongodb/bin:$PATH"
    
    # Start MongoDB if not running
    if ! check_mongodb; then
        if ! start_mongodb; then
            echo "❌ Cannot proceed without MongoDB"
            exit 1
        fi
    fi
    
    # Start backend if not running
    if ! check_backend; then
        if ! start_backend; then
            echo "❌ Cannot proceed without backend"
            exit 1
        fi
    fi
    
    # Start frontend if not running
    if ! check_frontend; then
        if ! start_frontend; then
            echo "❌ Cannot proceed without frontend"
            exit 1
        fi
    fi
    
    echo ""
    echo "🎉 All services are running!"
    echo "=========================="
    echo "📊 Dashboard: http://localhost:8000"
    echo "🔧 Backend API: http://localhost:5002"
    echo "💾 MongoDB: mongodb://localhost:27017"
    echo ""
    echo "🔄 CI/CD Simulation: Running (new builds every 10 seconds)"
    echo "📱 Auto-refresh: Enabled (dashboard updates every 5 seconds)"
    echo ""
    echo "💡 To stop all services:"
    echo "   - Frontend: Ctrl+C in this terminal"
    echo "   - Backend: Kill process with PID from above"
    echo "   - MongoDB: mongod --shutdown"
    echo ""
    echo "🔍 To check logs:"
    echo "   - MongoDB: tail -f /usr/local/var/log/mongodb/mongo.log"
    echo "   - Backend: Check terminal where server is running"
    echo ""
    
    # Keep the script running to maintain the frontend server
    echo "Press Ctrl+C to stop the frontend server..."
    wait $FRONTEND_PID
}

# Handle cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    
    # Kill frontend if running
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend server stopped"
    fi
    
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run main function
main
