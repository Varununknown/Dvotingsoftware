// Backend sync routes for real-time admin-voter synchronization
const express = require('express');
const router = express.Router();
const Election = require('../models/Election');

// Store admin actions for triggering updates
let adminActions = [];
let lastUpdateTimestamp = Date.now();

/**
 * GET /api/sync/elections
 * Returns current election state with sync metadata
 */
router.get('/elections', async (req, res) => {
  try {
    // Fetch all elections with latest data
    const elections = await Election.find({}).sort({ createdAt: -1 });
    
    // Check if there are recent admin actions
    const recentActions = adminActions.filter(action => 
      action.timestamp > (Date.now() - 10000) // Last 10 seconds
    );
    
    const syncData = {
      elections,
      lastUpdated: lastUpdateTimestamp,
      forceRefresh: recentActions.length > 0,
      adminActions: recentActions
    };

    res.json(syncData);
  } catch (error) {
    console.error('Sync endpoint error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch sync data',
      error: error.message 
    });
  }
});

/**
 * POST /api/elections/admin-action
 * Notify about admin actions for triggering sync
 */
router.post('/admin-action', async (req, res) => {
  try {
    const { action, data, timestamp } = req.body;
    
    // Store admin action
    const adminAction = {
      action,
      data,
      timestamp: timestamp || Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    adminActions.push(adminAction);
    lastUpdateTimestamp = Date.now();
    
    // Keep only last 50 actions to prevent memory issues
    if (adminActions.length > 50) {
      adminActions = adminActions.slice(-50);
    }
    
    console.log('Admin action recorded:', action);
    
    res.json({ 
      success: true, 
      message: 'Admin action recorded',
      actionId: adminAction.id
    });
  } catch (error) {
    console.error('Admin action error:', error);
    res.status(500).json({ 
      message: 'Failed to record admin action',
      error: error.message 
    });
  }
});

/**
 * POST /api/elections/:id/release-results
 * Release election results (admin only)
 */
router.post('/:id/release-results', async (req, res) => {
  try {
    const { id } = req.params;
    const { releaseMessage, releaseType } = req.body;
    
    // Find and update election
    const election = await Election.findById(id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // Update election with result release info
    election.resultsReleased = true;
    election.resultsReleasedAt = new Date();
    election.resultReleaseMessage = releaseMessage || 'Results have been officially released';
    election.resultReleaseType = releaseType || 'standard';
    
    // Save election
    await election.save();
    
    // Record admin action for sync
    const adminAction = {
      action: 'RESULTS_RELEASED',
      data: {
        electionId: id,
        electionTitle: election.title,
        releaseMessage,
        releaseType
      },
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    adminActions.push(adminAction);
    lastUpdateTimestamp = Date.now();
    
    console.log('Results released for election:', election.title);
    
    res.json({
      success: true,
      message: 'Results released successfully',
      election: {
        id: election._id,
        title: election.title,
        resultsReleased: election.resultsReleased,
        resultsReleasedAt: election.resultsReleasedAt,
        resultReleaseMessage: election.resultReleaseMessage
      }
    });
  } catch (error) {
    console.error('Release results error:', error);
    res.status(500).json({ 
      message: 'Failed to release results',
      error: error.message 
    });
  }
});

/**
 * POST /api/elections/:id/update-status
 * Update election status (admin only) with sync notification
 */
router.post('/:id/update-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['upcoming', 'active', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find and update election
    const election = await Election.findById(id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    const oldStatus = election.status;
    election.status = status;
    await election.save();
    
    // Record admin action for sync
    const adminAction = {
      action: 'STATUS_CHANGED',
      data: {
        electionId: id,
        electionTitle: election.title,
        oldStatus,
        newStatus: status
      },
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    adminActions.push(adminAction);
    lastUpdateTimestamp = Date.now();
    
    console.log(`Election ${election.title} status changed: ${oldStatus} → ${status}`);
    
    res.json({
      success: true,
      message: 'Election status updated',
      election
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      message: 'Failed to update election status',
      error: error.message 
    });
  }
});

module.exports = router;