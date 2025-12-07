import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USERS_FILE = join(__dirname, '../data/users.json');

// Helper to read users data
function readUsers() {
  try {
    const data = readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[ERROR] Failed to read users.json:', error);
    return {};
  }
}

// Helper to write users data
function writeUsers(users) {
  try {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to write users.json:', error);
    return false;
  }
}

/**
 * Activates a credit card for a user
 */
export async function activateCard(userId, cardId) {
  console.log(`[ACTION] Activating card ${cardId} for user ${userId}`);
  
  const users = readUsers();
  
  if (!users[userId]) {
    return {
      success: false,
      error: 'User not found',
      userId,
      cardId
    };
  }

  const user = users[userId];
  const card = user.cards?.find(c => c.cardId === cardId);

  if (!card) {
    return {
      success: false,
      error: 'Card not found',
      userId,
      cardId
    };
  }

  if (card.status === 'active') {
    return {
      success: true,
      message: 'Card is already active',
      userId,
      cardId,
      status: 'active'
    };
  }

  // Update card status
  card.status = 'active';
  card.activatedDate = new Date().toISOString();

  // Save to file
  if (writeUsers(users)) {
    console.log(`[ACTION] Card ${cardId} activated successfully for user ${userId}`);
    return {
      success: true,
      message: 'Card activated successfully',
      userId,
      cardId,
      status: 'active',
      activatedDate: card.activatedDate
    };
  } else {
    return {
      success: false,
      error: 'Failed to save card activation',
      userId,
      cardId
    };
  }
}

/**
 * Sets autopay for a user's account
 */
export async function setAutopay(userId, accountId, enabled) {
  console.log(`[ACTION] Setting autopay for user ${userId}, account ${accountId}: ${enabled}`);
  
  const users = readUsers();
  
  if (!users[userId]) {
    return {
      success: false,
      error: 'User not found',
      userId,
      accountId
    };
  }

  const user = users[userId];
  const account = user.accounts?.find(a => a.accountId === accountId);

  if (!account) {
    return {
      success: false,
      error: 'Account not found',
      userId,
      accountId
    };
  }

  // Update autopay settings
  if (!account.autopay) {
    account.autopay = {};
  }
  
  account.autopay.enabled = enabled;
  
  if (enabled) {
    // Set default payment date to statement due date if not specified
    account.autopay.paymentDate = account.autopay.paymentDate || user.statements?.dueDate || '2024-01-25';
    account.autopay.amount = account.autopay.amount || 'minimum';
  }

  // Save to file
  if (writeUsers(users)) {
    console.log(`[ACTION] Autopay ${enabled ? 'enabled' : 'disabled'} for user ${userId}`);
    return {
      success: true,
      message: `Autopay ${enabled ? 'enabled' : 'disabled'} successfully`,
      userId,
      accountId,
      autopay: account.autopay
    };
  } else {
    return {
      success: false,
      error: 'Failed to save autopay settings',
      userId,
      accountId
    };
  }
}

/**
 * Gets the status of a card (delivery and activation status)
 */
export async function getCardStatus(cardId, userId = null) {
  console.log(`[ACTION] Getting card status for ${cardId}`);
  
  const users = readUsers();
  
  // Find card across all users (or filter by userId if provided)
  let card = null;
  let foundUser = null;

  for (const [uid, user] of Object.entries(users)) {
    if (userId && uid !== userId) continue;
    
    const found = user.cards?.find(c => c.cardId === cardId);
    if (found) {
      card = found;
      foundUser = user;
      break;
    }
  }

  if (!card) {
    return {
      success: false,
      error: 'Card not found',
      cardId
    };
  }

  return {
    success: true,
    cardId,
    status: card.status,
    deliveryStatus: card.deliveryStatus,
    deliveryDate: card.deliveryDate,
    activatedDate: card.activatedDate,
    last4: card.last4,
    type: card.type
  };
}

/**
 * Creates a dispute for a transaction
 */
export async function disputeTransaction(userId, txnId, reason) {
  console.log(`[ACTION] Creating dispute for transaction ${txnId} by user ${userId}`);
  
  const users = readUsers();
  
  if (!users[userId]) {
    return {
      success: false,
      error: 'User not found',
      userId,
      txnId
    };
  }

  const user = users[userId];
  const transaction = user.transactions?.find(t => t.txnId === txnId);

  if (!transaction) {
    return {
      success: false,
      error: 'Transaction not found',
      userId,
      txnId
    };
  }

  // Generate dispute ID
  const disputeId = `dispute_${Date.now()}`;

  // Create dispute record (in a real system, this would be stored in a disputes table)
  const dispute = {
    disputeId,
    userId,
    txnId,
    transaction: {
      date: transaction.date,
      merchant: transaction.merchant,
      amount: transaction.amount
    },
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
    estimatedResolutionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days
  };

  console.log(`[ACTION] Dispute created: ${disputeId}`);
  
  return {
    success: true,
    message: 'Dispute created successfully',
    disputeId,
    status: 'pending',
    dispute
  };
}

/**
 * Processes a repayment
 */
export async function repayAmount(userId, amount, method) {
  console.log(`[ACTION] Processing repayment of $${amount} for user ${userId} via ${method}`);
  
  const users = readUsers();
  
  if (!users[userId]) {
    return {
      success: false,
      error: 'User not found',
      userId
    };
  }

  const user = users[userId];
  const account = user.accounts?.[0]; // Use first account for simplicity

  if (!account) {
    return {
      success: false,
      error: 'Account not found',
      userId
    };
  }

  // Validate amount
  if (amount > account.balance) {
    return {
      success: false,
      error: 'Payment amount exceeds balance',
      userId,
      amount,
      currentBalance: account.balance
    };
  }

  // Update balance
  const oldBalance = account.balance;
  account.balance = Math.max(0, account.balance - amount);
  account.availableCredit = account.creditLimit - account.balance;

  // Create payment record
  const paymentId = `payment_${Date.now()}`;
  const payment = {
    paymentId,
    userId,
    amount,
    method,
    date: new Date().toISOString(),
    status: 'processed'
  };

  // Save to file
  if (writeUsers(users)) {
    console.log(`[ACTION] Payment processed: ${paymentId}, new balance: $${account.balance}`);
    return {
      success: true,
      message: 'Payment processed successfully',
      paymentId,
      userId,
      amount,
      method,
      previousBalance: oldBalance,
      newBalance: account.balance,
      availableCredit: account.availableCredit
    };
  } else {
    return {
      success: false,
      error: 'Failed to process payment',
      userId
    };
  }
}

