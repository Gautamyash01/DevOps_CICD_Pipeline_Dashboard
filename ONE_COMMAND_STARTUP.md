# 🚀 One-Command Startup

I've created a simple `start.sh` script that starts your entire DevOps CI/CD Dashboard with one command!

## 📋 Usage

Navigate to your project folder and run:

```bash
cd DevOps_CICD_Pipeline_Dashboard_Project
./start.sh
```

## ✅ What It Does

The script automatically:

1. **🔍 Checks Services** - Detects if MongoDB, Backend, or Frontend are already running
2. **📦 Starts MongoDB** - Launches MongoDB server if not running
3. **🔧 Starts Backend** - Launches Node.js backend with MongoDB integration
4. **🌐 Starts Frontend** - Launches Python HTTP server
5. **⏳ Waits for Ready** - Ensures all services are properly started
6. **📊 Shows URLs** - Displays all access URLs and useful commands
7. **🛑 Graceful Shutdown** - Handles Ctrl+C to stop services cleanly

## 🎯 Features

- ✅ **Smart Detection** - Won't start services that are already running
- ✅ **Error Handling** - Checks if each service starts successfully
- ✅ **Health Checks** - Waits for services to be ready before proceeding
- ✅ **Clear Output** - Shows progress and status for each step
- ✅ **Useful Info** - Displays commands for monitoring and debugging
- ✅ **Graceful Stop** - Clean shutdown when you press Ctrl+C

## 📍 Access Points

Once running, you can access:

- **📊 Dashboard**: http://localhost:8000
- **🔧 Backend API**: http://localhost:5002
- **❤️ Health Check**: http://localhost:5002/health
- **💾 MongoDB**: mongodb://localhost:27017

## 🛑 Stopping Services

Press **Ctrl+C** to stop the frontend server. The script will show you how to manually stop the backend and MongoDB if needed.

## 🔍 Monitoring Commands

The script provides these useful commands:

```bash
# View MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Check API data
curl http://localhost:5002/api/metrics/dashboard

# View recent builds
curl http://localhost:5002/api/builds/recent

# Health check
curl http://localhost:5002/health
```

## 🎉 That's It!

Now you can start your entire full-stack DevOps CI/CD Dashboard with just one command:

```bash
./start.sh
```

The script handles everything automatically and provides clear feedback at each step! 🚀
