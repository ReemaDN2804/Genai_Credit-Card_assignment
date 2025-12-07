import express from 'express';
import {
  activateCard,
  setAutopay,
  getCardStatus,
  disputeTransaction,
  repayAmount
} from '../controllers/actionsController.js';

const router = express.Router();

/**
 * POST /api/v1/activate-card
 * Activates a credit card for a user
 */
router.post('/activate-card', async (req, res) => {
  try {
    const { userId, cardId } = req.body;

    if (!userId || !cardId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'cardId']
      });
    }

    const result = await activateCard(userId, cardId);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] Activate card failed:', error);
    res.status(500).json({ 
      error: 'Failed to activate card',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/set-autopay
 * Enables or disables autopay for a user's account
 */
router.post('/set-autopay', async (req, res) => {
  try {
    const { userId, accountId, enabled } = req.body;

    if (!userId || accountId === undefined || enabled === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'accountId', 'enabled']
      });
    }

    const result = await setAutopay(userId, accountId, enabled);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] Set autopay failed:', error);
    res.status(500).json({ 
      error: 'Failed to set autopay',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/card-status/:cardId
 * Gets the delivery/activation status of a card
 */
router.get('/card-status/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    const { userId } = req.query; // Optional, for authorization check

    if (!cardId) {
      return res.status(400).json({ error: 'cardId is required' });
    }

    const result = await getCardStatus(cardId, userId);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] Get card status failed:', error);
    res.status(500).json({ 
      error: 'Failed to get card status',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/dispute
 * Creates a dispute for a transaction
 */
router.post('/dispute', async (req, res) => {
  try {
    const { userId, txnId, reason } = req.body;

    if (!userId || !txnId || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'txnId', 'reason']
      });
    }

    const result = await disputeTransaction(userId, txnId, reason);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] Dispute transaction failed:', error);
    res.status(500).json({ 
      error: 'Failed to create dispute',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/repay
 * Processes a repayment
 */
router.post('/repay', async (req, res) => {
  try {
    const { userId, amount, method } = req.body;

    if (!userId || !amount || !method) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'amount', 'method']
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const result = await repayAmount(userId, amount, method);
    res.json(result);
  } catch (error) {
    console.error('[ERROR] Repay failed:', error);
    res.status(500).json({ 
      error: 'Failed to process repayment',
      message: error.message 
    });
  }
});

export default router;

