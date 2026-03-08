#!/bin/bash

# DevOps CI/CD Dashboard - One-Command Startup
# Usage: ./start.sh

echo "🚀 Starting DevOps CI/CD Dashboard..."
echo "=================================="

# Function to check if a service is already running
is_running() {
    pgrep -f "$1" > /dev/null 2>&1
    return $?
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts..."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within $max_attempts seconds"
    return 1
}

# Set up environment
export PATH="/usr/local/mongodb/bin:$PATH"

# 1. Start MongoDB
echo ""
echo "📦 Step 1: Starting MongoDB..."
if is_running "mongod"; then
    echo "✅ MongoDB is already running"
else
    mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
    
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB started successfully"
        sleep 2
    else
        echo "❌ Failed to start MongoDB"
        echo "💡 Make sure MongoDB is installed and paths are correct"
        exit 1
    fi
fi

# 2. Start Backend
echo ""
echo "🔧 Step 2: Starting Backend Server..."
if is_running "node server-mongodb.js"; then
    echo "✅ Backend is already running"
else
    cd backend
    node server-mongodb.js &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to be ready
    if wait_for_service "http://localhost:5002/health" "Backend"; then
        echo "✅ Backend started successfully (PID: $BACKEND_PID)"
    else
        echo "❌ Backend failed to start properly"
        exit 1
    fi
fi

# 3. Start Frontend
echo ""
echo "🌐 Step 3: Starting Frontend Server..."
if is_running "python3 -m http.server"; then
    echo "✅ Frontend is already running"
else
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
    
    # Wait for frontend to be ready
    sleep 2
    if curl -s "http://localhost:8000" > /dev/null 2>&1; then
        echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"
    else
        echo "❌ Frontend failed to start"
        exit 1
    fi
fi

# 4. Show Status and URLs
echo ""
echo "🎉 All services are running!"
echo "=========================="
echo "📊 Dashboard:     http://localhost:8000"
echo "🔧 Backend API:    http://localhost:5002"
echo "� API Info:       http://localhost:5002/  (Shows API endpoints)"
echo "❤️  Health Check:   http://localhost:5002/health"
echo "💾 MongoDB:        mongodb://localhost:27017"
echo ""
echo "🔄 CI/CD Simulation: Running (new builds every 10 seconds)"
echo "📱 Auto-refresh:    Enabled (dashboard updates every 5 seconds)"
echo ""

# 5. Show helpful commands
echo "💡 Useful Commands:"
echo "=================="
echo "📋 View MongoDB logs:   tail -f /usr/local/var/log/mongodb/mongo.log"
echo "🔍 Check API data:      curl http://localhost:5002/api/metrics/dashboard"
echo "📊 View builds:         curl http://localhost:5002/api/builds/recent"
echo "🔧 Check health:        curl http://localhost:5002/health"
echo ""
echo "🛑 To stop all services:"
echo "   • Press Ctrl+C to stop frontend"
echo "   • Backend will continue running (stop with: pkill -f 'node server-mongodb.js')"
echo "   • MongoDB will continue running (stop with: mongod --shutdown)"
echo ""

# 6. Keep script running to maintain frontend
echo "🖥 Dashboard is accessible at: http://localhost:8000"
echo "📱 Press Ctrl+C to stop the frontend server..."
echo ""

# Graceful shutdown handler
cleanup() {
    echo ""
    echo "🛑 Stopping frontend server..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    
    echo ""
    echo "📊 Backend and MongoDB are still running."
    echo "💡 To stop them manually:"
    echo "   • Backend: pkill -f 'node server-mongodb.js'"
    echo "   • MongoDB: mongod --shutdown"
    echo ""
    echo "👋 Goodbye!"
    exit 0
}

# Set up signal handler for graceful shutdown
trap cleanup SIGINT SIGTERM

# Keep the script running
wait $FRONTEND_PID
