const Deployment = require('../models/Deployment');
const Build = require('../models/Build');

// GET /api/deployments
const getDeployments = async (req, res) => {
  try {
    const deployments = await Deployment.find()
      .populate('buildId', 'status duration timestamp')
      .populate({
        path: 'buildId',
        populate: {
          path: 'pipelineId',
          select: 'name repository'
        }
      })
      .sort({ deployedAt: -1 });
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/deployments
const createDeployment = async (req, res) => {
  try {
    const { buildId, environment, status } = req.body;
    
    if (!buildId || !environment || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate build exists
    const build = await Build.findById(buildId);
    if (!build) {
      return res.status(404).json({ message: 'Build not found' });
    }

    const deployment = new Deployment({ buildId, environment, status });
    const savedDeployment = await deployment.save();
    
    // Populate related data for response
    const populatedDeployment = await Deployment.findById(savedDeployment._id)
      .populate('buildId', 'status duration timestamp')
      .populate({
        path: 'buildId',
        populate: {
          path: 'pipelineId',
          select: 'name repository'
        }
      });
    
    res.status(201).json(populatedDeployment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getDeployments,
  createDeployment
};
