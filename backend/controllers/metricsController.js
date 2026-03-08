const Build = require('../models/Build');
const Deployment = require('../models/Deployment');
const Pipeline = require('../models/Pipeline');

// GET /api/metrics/dashboard
const getDashboardMetrics = async (req, res) => {
  try {
    // Get total builds
    const totalBuilds = await Build.countDocuments();
    
    // Get successful builds
    const successfulBuilds = await Build.countDocuments({ status: 'success' });
    
    // Get failed builds
    const failedBuilds = await Build.countDocuments({ status: 'failed' });
    
    // Get deployment metrics
    const totalDeployments = await Deployment.countDocuments();
    const successfulDeployments = await Deployment.countDocuments({ status: 'success' });
    
    // Calculate deployment success rate
    const deploymentSuccessRate = totalDeployments === 0 
      ? 0 
      : Math.round((successfulDeployments / totalDeployments) * 100);
    
    // Get recent builds (last 40)
    const recentBuilds = await Build.find()
      .populate('pipelineId', 'name repository')
      .sort({ timestamp: -1 })
      .limit(40);
    
    // Get builds for charts (last 100 for better data)
    const buildsForCharts = await Build.find()
      .populate('pipelineId', 'name')
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Get builds per pipeline
    const buildsPerPipeline = await Build.aggregate([
      {
        $lookup: {
          from: 'pipelines',
          localField: 'pipelineId',
          foreignField: '_id',
          as: 'pipeline'
        }
      },
      {
        $unwind: '$pipeline'
      },
      {
        $group: {
          _id: '$pipeline.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get build history over time (grouped by hour for last 24 hours)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const buildHistory = await Build.aggregate([
      {
        $match: {
          timestamp: { $gte: twentyFourHoursAgo }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          success: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.date': 1, '_id.hour': 1 }
      }
    ]);
    
    res.json({
      totalBuilds,
      successfulBuilds,
      failedBuilds,
      deploymentSuccessRate,
      totalDeployments,
      successfulDeployments,
      recentBuilds,
      buildsForCharts,
      buildsPerPipeline,
      buildHistory
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardMetrics
};
