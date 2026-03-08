# DevOps CI/CD Pipeline Dashboard

A full-stack interactive web-based dashboard that monitors real CI/CD pipeline workflows. This project demonstrates modern DevOps practices with a Node.js backend, MongoDB database, and real-time frontend visualization.

## Project Objective

The main objective of this project is to create an interactive dashboard that:
- Monitors real CI/CD pipeline runs
- Displays real-time pipeline status and metrics
- Maintains persistent history of pipeline executions
- Provides a hands-on learning experience for DevOps concepts
- Demonstrates full-stack web development with real-time data

## Technologies Used

### Frontend
- **HTML5**: Semantic markup for the dashboard structure
- **CSS3**: Modern styling with Grid, Flexbox, and responsive design
- **JavaScript (ES6+)**: Interactive functionality and real-time data fetching
- **Chart.js**: Data visualization for build history and metrics

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web framework for REST API
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: MongoDB object modeling for Node.js
- **CORS**: Cross-origin resource sharing

## Features

### Dashboard Components
1. **Status Cards**: Display latest build status, deployment status, total runs, and success rate
2. **Real-time Charts**: Build history, deployment outcomes, and builds per pipeline
3. **History Table**: Complete log of all pipeline executions with timestamps
4. **Responsive Design**: Works on desktop, tablet, and mobile devices
5. **Auto-refresh**: Dashboard updates every 5 seconds with latest data

### Backend Features
- RESTful API endpoints for pipelines, builds, deployments, and metrics
- Background CI/CD simulation process (generates new builds every 10 seconds)
- MongoDB data persistence with proper relationships
- Real-time metrics calculation and aggregation
- CORS-enabled API for frontend integration

### Simulation Logic
- Realistic build results (65% success, 20% running, 15% failure)
- Automatic deployment generation for successful builds
- Multiple environments (dev, staging, production)
- Various trigger sources (GitHub Actions, Jenkins, etc.)

## How to Run the Project

### Prerequisites
- **Node.js** (version 14 or higher)
- **MongoDB** (installed and running locally)
- **npm** (comes with Node.js)
- Any modern web browser (Chrome, Firefox, Safari, Edge)

### MongoDB Installation (macOS)

If MongoDB is not installed on your macOS system:

```bash
# Download MongoDB Community Server for macOS ARM64
cd /tmp
curl -O https://fastdl.mongodb.org/osx/mongodb-macos-arm64-7.0.5.tgz

# Extract and install
tar -xzf mongodb-macos-arm64-7.0.5.tgz
sudo cp -R mongodb-macos-aarch64-7.0.5 /usr/local/mongodb

# Create necessary directories
sudo mkdir -p /usr/local/var/mongodb
sudo mkdir -p /usr/local/var/log/mongodb

# Set ownership
sudo chown -R $USER /usr/local/var/mongodb
sudo chown -R $USER /usr/local/var/log/mongodb

# Add to PATH
echo 'export PATH="/usr/local/mongodb/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Start MongoDB server
mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
```

### Quick Start (Recommended)

Use the automated startup script:

```bash
# Clone and navigate to project
git clone <repository-url>
cd DevOps_CICD_Pipeline_Dashboard_Project

# Run the full-stack startup script
./start-full-stack.sh
```

This script will:
- ✅ Check and start MongoDB if needed
- ✅ Start the backend server with MongoDB
- ✅ Start the frontend development server
- ✅ Provide all URLs and status information

### Manual Setup

1. **Download/Clone the Project**
   ```bash
   git clone <repository-url>
   cd DevOps_CICD_Pipeline_Dashboard_Project
   ```

2. **Start MongoDB**
   ```bash
   export PATH="/usr/local/mongodb/bin:$PATH"
   mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
   ```

3. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

4. **Start Backend Server**
   ```bash
   # For development (with auto-restart)
   npm run dev
   
   # For production
   npm start
   
   # Or use MongoDB server directly
   node server-mongodb.js
   ```
   
   The backend server will run on **http://localhost:5002**

5. **Start Frontend**
   In a new terminal, navigate to the project root:
   ```bash
   cd ..  # Back to project root
   
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Node.js (if you have http-server)
   npx http-server 8000
   ```

6. **Access the Dashboard**
   Open your browser and navigate to:
   - Frontend: **http://localhost:8000**
   - Backend API: **http://localhost:5002** (for API testing)
   - Health Check: **http://localhost:5002/health**

## Usage Instructions

1. **View Dashboard**: The main page shows current pipeline status and metrics
2. **Trigger Pipeline**: Click the "Trigger Pipeline" button to simulate a new CI/CD run
3. **Monitor Results**: Watch the status cards update with new results
4. **View History**: Scroll through the history table to see all past pipeline runs
5. **Data Persistence**: All data is saved automatically and persists across browser sessions

## Project Structure

```
DevOps_CICD_Pipeline_Dashboard_Project/
├── backend/                    # Node.js backend API
│   ├── config/
│   │   └── db.js              # MongoDB connection configuration
│   ├── models/
│   │   ├── Pipeline.js        # Pipeline data model
│   │   ├── Build.js           # Build data model
│   │   └── Deployment.js      # Deployment data model
│   ├── controllers/
│   │   ├── pipelineController.js
│   │   ├── buildController.js
│   │   ├── deploymentController.js
│   │   └── metricsController.js
│   ├── routes/
│   │   ├── pipelineRoutes.js
│   │   ├── buildRoutes.js
│   │   ├── deploymentRoutes.js
│   │   └── metricsRoutes.js
│   ├── server.js              # Main Express server
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables
├── index.html                 # Main dashboard HTML structure
├── style.css                  # CSS styling and responsive design
├── script.js                  # JavaScript functionality and API integration
└── README.md                  # Project documentation (this file)
```

## API Endpoints

### Pipelines
- `GET /api/pipelines` - Get all pipelines
- `POST /api/pipelines` - Create a new pipeline

### Builds
- `GET /api/builds` - Get all builds
- `GET /api/builds/recent` - Get recent builds (limited)
- `POST /api/builds` - Create a new build

### Deployments
- `GET /api/deployments` - Get all deployments
- `POST /api/deployments` - Create a new deployment

### Metrics
- `GET /api/metrics/dashboard` - Get dashboard metrics including:
  - Total builds
  - Successful builds
  - Failed builds
  - Deployment success rate
  - Recent builds data
  - Charts data

### System
- `GET /health` - Health check endpoint

## Database Models

### Pipeline
```javascript
{
  name: String (required),
  repository: String (required),
  createdAt: Date (default: Date.now)
}
```

### Build
```javascript
{
  pipelineId: ObjectId (ref: Pipeline),
  status: String (enum: ['success', 'failed', 'running']),
  triggeredBy: String (required),
  duration: Number (required),
  timestamp: Date (default: Date.now)
}
```

### Deployment
```javascript
{
  buildId: ObjectId (ref: Build),
  environment: String (enum: ['dev', 'staging', 'production']),
  status: String (enum: ['success', 'failed']),
  deployedAt: Date (default: Date.now)
}
```

## Code Explanation

### Backend (`server.js`)
- **Express.js Setup**: REST API with CORS middleware
- **Database Connection**: MongoDB connection with Mongoose
- **Background Simulation**: Automatic CI/CD activity generation
- **Error Handling**: Comprehensive error handling and logging

### Frontend (`script.js`)
- **API Integration**: Real-time data fetching from backend
- **Data Transformation**: Converting API data to UI-compatible format
- **Chart.js Integration**: Dynamic chart updates with real data
- **Auto-refresh**: 5-second interval updates
- **Event Handling**: User interaction management

### HTML Structure (`index.html`)
- Semantic HTML5 elements for accessibility
- Responsive grid layout for status cards
- Chart containers for data visualization
- Progressive enhancement approach

### CSS Styling (`style.css`)
- Modern CSS Grid and Flexbox layouts
- Responsive design with media queries
- Smooth transitions and hover effects
- Color-coded status indicators
- Mobile-first responsive approach

## Learning Outcomes

This project helps students understand:
- CI/CD pipeline concepts and workflows
- Full-stack web development with Node.js and Express
- MongoDB database design and Mongoose ODM
- RESTful API design and implementation
- Real-time data visualization with Chart.js
- Frontend-backend integration and CORS
- Background processes and data simulation
- Responsive web design principles
- Modern JavaScript features (async/await, fetch API)
- Error handling and logging best practices

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development

### Environment Variables
Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/devops-dashboard
PORT=5002
```

**Note**: MongoDB is now fully installed and configured. The project uses real MongoDB database for data persistence.

### Available Scripts

#### Backend
```bash
cd backend
npm run dev      # Start with nodemon (development)
npm start        # Start production server
npm test         # Run tests (if added)
```

#### Frontend
```bash
# Start development server
python3 -m http.server 8000
# or
npx http-server 8000
```

### Quick Start Commands

```bash
# Start everything with one command
./start-full-stack.sh

# Or start services individually
export PATH="/usr/local/mongodb/bin:$PATH"
mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
cd backend && node server-mongodb.js &
cd .. && python3 -m http.server 8000
```

### Monitoring
- **Backend logs**: Show CI/CD simulation activity and database operations
- **Frontend browser console**: Shows API calls and any frontend errors
- **MongoDB logs**: Located at `/usr/local/var/log/mongodb/mongo.log`
- **Database inspection**: Use MongoDB Compass or `mongosh` to view data

### Server Status
- **MongoDB**: Running on port 27017
- **Backend API**: Running on port 5002
- **Frontend**: Running on port 8000
- **CI/CD Simulation**: Active (creates new builds every 10 seconds)
- **Dashboard Auto-refresh**: Active (updates every 5 seconds)

## Troubleshooting

### Common Issues
1. **MongoDB Connection Error**: Ensure MongoDB is running
2. **CORS Issues**: Backend includes CORS middleware
3. **Port Conflicts**: Change PORT in .env if needed
4. **API Not Responding**: Check backend server logs
5. **Data Not Loading**: Verify API endpoints are accessible

### Reset Data
To clear all pipeline data:
```bash
# Connect to MongoDB and drop the database
mongo devops-dashboard
db.dropDatabase()
```

### Debug Mode
Enable detailed logging by setting:
```env
DEBUG=*
```

## Customization Options

### Modify Simulation Rates
Edit the probabilities in `backend/server.js`:
```javascript
// Build success rate (currently 65%)
if (random < 0.65) status = 'success';
else if (random < 0.85) status = 'running';
else status = 'failed';

// Deployment success rate (currently 75%)
const deploymentStatus = Math.random() < 0.75 ? 'success' : 'failed';
```

### Change Update Intervals
```javascript
// Backend simulation interval (currently 10 seconds)
setInterval(simulateCICDActivity, 10000);

// Frontend refresh interval (currently 5 seconds)
setInterval(updateDashboardData, 5000);
```

### Change Styling
Modify colors and layouts in `style.css`:
- Update CSS variables for theming
- Adjust grid layouts for different screen sizes
- Customize animation timings

### Add New Features
Potential extensions:
- Export history to CSV/JSON
- Add more pipeline stages
- Implement user authentication
- Add real-time WebSocket updates
- Implement advanced filtering and search
- Add pipeline configuration management
- Integrate with real CI/CD tools (GitHub Actions, Jenkins)
- Add alerting and notifications
- Implement data analytics and reporting

## Academic Use

This project is specifically designed for:
- Web programming courses
- DevOps introduction modules
- Frontend development assignments
- Educational demonstrations

## License

This project is open source and available for educational purposes. Feel free to modify and distribute according to your academic needs.

---

**Note**: This is a simulation project for educational purposes only. It does not implement actual CI/CD functionality or integrate with real DevOps tools.
