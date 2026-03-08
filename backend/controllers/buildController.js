const Build = require('../models/Build');
const Pipeline = require('../models/Pipeline');

// GET /api/builds
const getBuilds = async (req, res) => {
  try {
    const builds = await Build.find()
      .populate('pipelineId', 'name repository')
      .sort({ timestamp: -1 });
    res.json(builds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/builds/recent
const getRecentBuilds = async (req, res) => {
  try {
    const builds = await Build.find()
      .populate('pipelineId', 'name repository')
      .sort({ timestamp: -1 })
      .limit(40);
    res.json(builds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/builds
const createBuild = async (req, res) => {
  try {
    const { pipelineId, status, triggeredBy, duration } = req.body;
    
    if (!pipelineId || !status || !triggeredBy || !duration) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate pipeline exists
    const pipeline = await Pipeline.findById(pipelineId);
    if (!pipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }

    const build = new Build({ pipelineId, status, triggeredBy, duration });
    const savedBuild = await build.save();
    
    // Populate pipeline info for response
    const populatedBuild = await Build.findById(savedBuild._id)
      .populate('pipelineId', 'name repository');
    
    res.status(201).json(populatedBuild);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getBuilds,
  getRecentBuilds,
  createBuild
};
