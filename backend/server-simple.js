const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage for demo purposes
let pipelines = [
  { _id: '1', name: 'Core API', repository: 'github.com/company/core-api', createdAt: new Date() },
  { _id: '2', name: 'Web Frontend', repository: 'github.com/company/web-frontend', createdAt: new Date() },
  { _id: '3', name: 'Worker Jobs', repository: 'github.com/company/worker-jobs', createdAt: new Date() },
  { _id: '4', name: 'Mobile App', repository: 'github.com/company/mobile-app', createdAt: new Date() },
  { _id: '5', name: 'Data Pipeline', repository: 'github.com/company/data-pipeline', createdAt: new Date() }
];

let builds = [];
let deployments = [];
let buildCounter = 1;

// Helper functions
const generateRandomBuild = () => {
  const pipeline = pipelines[Math.floor(Math.random() * pipelines.length)];
  const statuses = ['success', 'failed', 'running'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const triggeredBy = ['github-actions[bot]', 'jenkins-ci', 'circleci', 'gitlab-runner', 'yash.raj'][Math.floor(Math.random() * 5)];
  const duration = Math.floor(Math.random() * (1200 - 45 + 1)) + 45;
  
  return {
    _id: String(buildCounter++),
    pipelineId: pipeline._id,
    pipelineId: { _id: pipeline._id, name: pipeline.name, repository: pipeline.repository },
    status,
    triggeredBy,
    duration,
    timestamp: new Date()
  };
};

// Initialize with some data
for (let i = 0; i < 20; i++) {
  const build = generateRandomBuild();
  build.timestamp = new Date(Date.now() - i * 5 * 60 * 1000); // Every 5 minutes
  builds.push(build);
}

// API Routes

// GET /api/pipelines
app.get('/api/pipelines', (req, res) => {
  res.json(pipelines);
});

// POST /api/pipelines
app.post('/api/pipelines', (req, res) => {
  const { name, repository } = req.body;
  if (!name || !repository) {
    return res.status(400).json({ message: 'Name and repository are required' });
  }
  
  const pipeline = {
    _id: String(pipelines.length + 1),
    name,
    repository,
    createdAt: new Date()
  };
  
  pipelines.push(pipeline);
  res.status(201).json(pipeline);
});

// GET /api/builds
app.get('/api/builds', (req, res) => {
  res.json(builds);
});

// GET /api/builds/recent
app.get('/api/builds/recent', (req, res) => {
  res.json(builds.slice(-40).reverse());
});

// POST /api/builds
app.post('/api/builds', (req, res) => {
  const { pipelineId, status, triggeredBy, duration } = req.body;
  
  if (!pipelineId || !status || !triggeredBy || !duration) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  const pipeline = pipelines.find(p => p._id === pipelineId);
  if (!pipeline) {
    return res.status(404).json({ message: 'Pipeline not found' });
  }
  
  const build = {
    _id: String(buildCounter++),
    pipelineId: { _id: pipeline._id, name: pipeline.name, repository: pipeline.repository },
    status,
    triggeredBy,
    duration,
    timestamp: new Date()
  };
  
  builds.push(build);
  res.status(201).json(build);
});

// GET /api/deployments
app.get('/api/deployments', (req, res) => {
  res.json(deployments);
});

// POST /api/deployments
app.post('/api/deployments', (req, res) => {
  const { buildId, environment, status } = req.body;
  
  if (!buildId || !environment || !status) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  const build = builds.find(b => b._id === buildId);
  if (!build) {
    return res.status(404).json({ message: 'Build not found' });
  }
  
  const deployment = {
    _id: String(deployments.length + 1),
    buildId: { ...build },
    environment,
    status,
    deployedAt: new Date()
  };
  
  deployments.push(deployment);
  res.status(201).json(deployment);
});

// GET /api/metrics/dashboard
app.get('/api/metrics/dashboard', (req, res) => {
  const totalBuilds = builds.length;
  const successfulBuilds = builds.filter(b => b.status === 'success').length;
  const failedBuilds = builds.filter(b => b.status === 'failed').length;
  const totalDeployments = deployments.length;
  const successfulDeployments = deployments.filter(d => d.status === 'success').length;
  
  const deploymentSuccessRate = totalDeployments === 0 ? 0 : Math.round((successfulDeployments / totalDeployments) * 100);
  
  const recentBuilds = builds.slice(-40).reverse();
  
  // Build history data (last 24 hours grouped by hour)
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentBuildsForHistory = builds.filter(b => new Date(b.timestamp) >= twentyFourHoursAgo);
  
  const buildHistory = [];
  for (let i = 0; i < 24; i++) {
    const hourStart = new Date(twentyFourHoursAgo.getTime() + i * 60 * 60 * 1000);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    const hourBuilds = recentBuildsForHistory.filter(b => {
      const buildTime = new Date(b.timestamp);
      return buildTime >= hourStart && buildTime < hourEnd;
    });
    
    buildHistory.push({
      hour: hourStart.getHours(),
      success: hourBuilds.filter(b => b.status === 'success').length,
      failed: hourBuilds.filter(b => b.status === 'failed').length
    });
  }
  
  // Builds per pipeline
  const buildsPerPipeline = pipelines.map(pipeline => ({
    _id: pipeline.name,
    count: builds.filter(b => b.pipelineId._id === pipeline._id).length
  }));
  
  res.json({
    totalBuilds,
    successfulBuilds,
    failedBuilds,
    deploymentSuccessRate,
    totalDeployments,
    successfulDeployments,
    recentBuilds,
    buildsForCharts: builds.slice(-100).reverse(),
    buildsPerPipeline,
    buildHistory
  });
});

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

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Using in-memory data (MongoDB not available)');
});

// CI/CD Simulation Process
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

// Simulate CI/CD activity
const simulateCICDActivity = () => {
  try {
    const randomPipeline = pipelines[Math.floor(Math.random() * pipelines.length)];
    
    const random = Math.random();
    let status;
    if (random < 0.65) status = 'success';
    else if (random < 0.85) status = 'running';
    else status = 'failed';
    
    const duration = Math.floor(Math.random() * (1200 - 45 + 1)) + 45;
    const triggeredBy = TRIGGERED_BY[Math.floor(Math.random() * TRIGGERED_BY.length)];
    
    const build = {
      _id: String(buildCounter++),
      pipelineId: { _id: randomPipeline._id, name: randomPipeline.name, repository: randomPipeline.repository },
      status,
      triggeredBy,
      duration,
      timestamp: new Date()
    };
    
    builds.push(build);
    console.log(`New build created: ${build._id} (${status})`);
    
    // Keep only last 100 builds
    if (builds.length > 100) {
      builds = builds.slice(-100);
    }
    
    // If build is successful, create deployment
    if (status === 'success') {
      const randomEnv = ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)];
      const deploymentStatus = Math.random() < 0.75 ? 'success' : 'failed';
      
      const deployment = {
        _id: String(deployments.length + 1),
        buildId: { ...build },
        environment: randomEnv,
        status: deploymentStatus,
        deployedAt: new Date()
      };
      
      deployments.push(deployment);
      console.log(`Deployment created: ${deployment._id} (${deploymentStatus})`);
      
      // Keep only last 50 deployments
      if (deployments.length > 50) {
        deployments = deployments.slice(-50);
      }
    }
    
  } catch (error) {
    console.error('Error simulating CI/CD activity:', error);
  }
};

// Start simulation after server starts
setTimeout(() => {
  console.log('CI/CD simulation started (runs every 10 seconds)');
  setInterval(simulateCICDActivity, 10000);
}, 5000);

module.exports = app;
