import * as webrtcService from '../services/webrtcService.js';
import * as billingService from '../services/billingService.js';

// Get ICE servers configuration
export const getIceServers = (req, res) => {
  try {
    const iceServers = webrtcService.getIceServers();
    res.json(iceServers);
  } catch (error) {
    console.error('Error getting ICE servers:', error);
    res.status(500).json({ message: 'Failed to get ICE servers' });
  }
};

// Create a new WebRTC session
export const createSession = async (req, res) => {
  try {
    const { readerId, sessionType, rate } = req.body;
    
    if (!readerId || !sessionType || !rate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await webrtcService.createSession(
      readerId,
      req.user.id,
      sessionType,
      rate
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating WebRTC session:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
};

// Process WebRTC signaling
export const processSignal = async (req, res) => {
  try {
    const { sessionId, toUserId, signal } = req.body;
    
    if (!sessionId || !toUserId || !signal) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await webrtcService.processSignal(
      sessionId,
      req.user.id,
      toUserId,
      signal
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error processing signal:', error);
    res.status(500).json({ message: 'Failed to process signal' });
  }
};

// Get pending signals
export const getPendingSignals = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const signals = await webrtcService.getPendingSignals(
      req.user.id,
      sessionId
    );
    
    res.json({ signals });
  } catch (error) {
    console.error('Error getting signals:', error);
    res.status(500).json({ message: 'Failed to get signals' });
  }
};

// Update session status
export const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, clientSdp, readerSdp } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Missing status' });
    }
    
    const additionalData = {};
    if (clientSdp) additionalData.client_sdp = clientSdp;
    if (readerSdp) additionalData.reader_sdp = readerSdp;
    
    const result = await webrtcService.updateSessionStatus(
      sessionId,
      status,
      additionalData
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: 'Failed to update session status' });
  }
};

// Process billing for a session
export const processBilling = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await billingService.processBilling(sessionId);
    
    res.json(result);
  } catch (error) {
    console.error('Error processing billing:', error);
    res.status(500).json({ 
      message: 'Failed to process billing',
      error: error.message
    });
  }
};

// End a session
export const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration, totalAmount } = req.body;
    
    // Update session status
    await webrtcService.updateSessionStatus(
      sessionId,
      'completed',
      {
        end_time: new Date(),
        duration_seconds: duration || 0,
        total_amount: totalAmount || 0
      }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Failed to end session' });
  }
};