const Pipeline = require('../models/Pipeline');

// GET /api/pipelines
const getPipelines = async (req, res) => {
  try {
    const pipelines = await Pipeline.find().sort({ createdAt: -1 });
    res.json(pipelines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/pipelines
const createPipeline = async (req, res) => {
  try {
    const { name, repository } = req.body;
    
    if (!name || !repository) {
      return res.status(400).json({ message: 'Name and repository are required' });
    }

    const pipeline = new Pipeline({ name, repository });
    const savedPipeline = await pipeline.save();
    res.status(201).json(savedPipeline);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPipelines,
  createPipeline
};
