const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if MongoDB is available
let connectDB;
let Pipeline, Build, Deployment;

try {
  connectDB = require('./config/db');
  Pipeline = require('./models/Pipeline');
  Build = require('./models/Build');
  Deployment = require('./models/Deployment');
  console.log('MongoDB models loaded successfully');
} catch (error) {
  console.log('MongoDB not available, using in-memory data');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const pipelineRoutes = require('./routes/pipelineRoutes');
const buildRoutes = require('./routes/buildRoutes');
const deploymentRoutes = require('./routes/deploymentRoutes');
const metricsRoutes = require('./routes/metricsRoutes');

// Use routes
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/builds', buildRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/metrics', metricsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// CI/CD Simulation Process
const Pipeline = require('./models/Pipeline');
const Build = require('./models/Build');
const Deployment = require('./models/Deployment');

const TRIGGERED_BY = [
  "github-actions[bot]",
  "jenkins-ci",
  "circleci",
  "gitlab-runner",
  "yash.raj",
  "platform-team",
  "release-bot"
];

const ENVIRONMENTS = ['dev', 'staging', 'production'];

// Initialize default pipelines if none exist
const initializePipelines = async () => {
  try {
    const pipelineCount = await Pipeline.countDocuments();
    if (pipelineCount === 0) {
      const defaultPipelines = [
        { name: "Core API", repository: "github.com/company/core-api" },
        { name: "Web Frontend", repository: "github.com/company/web-frontend" },
        { name: "Worker Jobs", repository: "github.com/company/worker-jobs" },
        { name: "Mobile App", repository: "github.com/company/mobile-app" },
        { name: "Data Pipeline", repository: "github.com/company/data-pipeline" }
      ];
      
      await Pipeline.insertMany(defaultPipelines);
      console.log('Default pipelines created');
    }
  } catch (error) {
    console.error('Error initializing pipelines:', error);
  }
};

// Simulate CI/CD activity
const simulateCICDActivity = async () => {
  try {
    // Get all pipelines
    const pipelines = await Pipeline.find();
    if (pipelines.length === 0) return;

    // Randomly select a pipeline
    const randomPipeline = pipelines[Math.floor(Math.random() * pipelines.length)];
    
    // Random build status (65% success, 20% running, 15% failed)
    const random = Math.random();
    let status;
    if (random < 0.65) status = 'success';
    else if (random < 0.85) status = 'running';
    else status = 'failed';
    
    // Random build duration (45s - 20m)
    const duration = Math.floor(Math.random() * (1200 - 45 + 1)) + 45;
    
    // Random trigger
    const triggeredBy = TRIGGERED_BY[Math.floor(Math.random() * TRIGGERED_BY.length)];
    
    // Create build
    const build = new Build({
      pipelineId: randomPipeline._id,
      status,
      triggeredBy,
      duration
    });
    
    const savedBuild = await build.save();
    console.log(`New build created: ${savedBuild._id} (${status})`);
    
    // If build is successful, create deployment
    if (status === 'success') {
      const randomEnv = ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)];
      const deploymentStatus = Math.random() < 0.75 ? 'success' : 'failed';
      
      const deployment = new Deployment({
        buildId: savedBuild._id,
        environment: randomEnv,
        status: deploymentStatus
      });
      
      await deployment.save();
      console.log(`Deployment created: ${deployment._id} (${deploymentStatus})`);
    }
    
  } catch (error) {
    console.error('Error simulating CI/CD activity:', error);
  }
};

// Start simulation after server starts
setTimeout(async () => {
  await initializePipelines();
  
  // Run simulation every 10 seconds
  setInterval(simulateCICDActivity, 10000);
  
  console.log('CI/CD simulation started (runs every 10 seconds)');
}, 5000);

module.exports = app;
