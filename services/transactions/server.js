const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10002;
const DB_PATH = path.join(__dirname, 'ledger.json');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ accounts: {}, transactions: [] }));
}

// Helpers
function readLedger() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { accounts: {}, transactions: [] };
  }
}

function writeLedger(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Get or Create Multi-Bank Account
function getOrCreateAccount(userId, username) {
  const ledger = readLedger();
  if (!ledger.accounts[userId]) {
    ledger.accounts[userId] = {
      userId,
      username,
      banks: {
        "Quantum Core": {
          balances: { USD: 50000.00, EUR: 12500.00, QTC: 500.00, SOL: 25.50 },
          accountNumber: 'Q-CORE-' + Math.floor(10000000 + Math.random() * 90000000)
        },
        "Aether Trust": {
          balances: { USD: 30000.00, EUR: 8500.00, QTC: 200.00, SOL: 10.00 },
          accountNumber: 'A-TRUST-' + Math.floor(10000000 + Math.random() * 90000000)
        },
        "Nova Reserve": {
          balances: { USD: 15000.00, EUR: 4000.00, QTC: 50.00, SOL: 5.00 },
          accountNumber: 'N-RESERVE-' + Math.floor(10000000 + Math.random() * 90000000)
        }
      }
    };
    writeLedger(ledger);
  }
  return ledger.accounts[userId];
}

// Routes
app.get('/health', (req, res) => {
  res.json({ service: 'transaction-service', status: 'ONLINE', timestamp: new Date() });
});

// Get Balances & Account Info
app.get('/api/transactions/balance', (req, res) => {
  const userId = req.headers['x-user-id'];
  const username = req.headers['x-user-username'] || 'Unknown User';

  if (!userId) {
    return res.status(400).json({ error: 'User ID header (x-user-id) missing.' });
  }

  const account = getOrCreateAccount(userId, username);
  res.json(account);
});

// Get Transactions history
app.get('/api/transactions/history', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({ error: 'User ID header (x-user-id) missing.' });
  }

  const ledger = readLedger();
  const userTransactions = ledger.transactions.filter(t => t.senderId === userId || t.recipientId === userId);
  res.json(userTransactions.reverse()); // latest first
});

// Deposit
app.post('/api/transactions/deposit', (req, res) => {
  const userId = req.headers['x-user-id'];
  const username = req.headers['x-user-username'] || 'Client';
  const { bank, amount, currency } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID header missing.' });
  if (!bank || !amount || !currency) return res.status(400).json({ error: 'Bank, amount, and currency are required.' });

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid deposit amount.' });

  const ledger = readLedger();
  const account = ledger.accounts[userId] || getOrCreateAccount(userId, username);

  if (!account.banks[bank]) return res.status(400).json({ error: 'Selected bank not active in matrix.' });
  if (!(currency in account.banks[bank].balances)) return res.status(400).json({ error: `Currency ${currency} not supported at ${bank}.` });

  // Add funds
  account.banks[bank].balances[currency] = parseFloat((account.banks[bank].balances[currency] + numAmount).toFixed(4));
  
  // Log transaction
  const transaction = {
    id: crypto.randomUUID(),
    senderId: 'SYSTEM-VAULT',
    senderUsername: 'Quantum Credit Mint',
    senderAccountNumber: 'SYSTEM-MINT',
    recipientId: userId,
    recipientUsername: username,
    recipientAccountNumber: account.banks[bank].accountNumber,
    amount: numAmount,
    currency,
    description: `Dépôt direct - ${bank}`,
    timestamp: new Date().toISOString()
  };

  ledger.transactions.push(transaction);
  ledger.accounts[userId] = account;
  writeLedger(ledger);

  res.json({ message: 'Deposit successful.', account, transaction });
});

// Withdraw
app.post('/api/transactions/withdraw', (req, res) => {
  const userId = req.headers['x-user-id'];
  const username = req.headers['x-user-username'] || 'Client';
  const { bank, amount, currency } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID header missing.' });
  if (!bank || !amount || !currency) return res.status(400).json({ error: 'Bank, amount, and currency are required.' });

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid withdrawal amount.' });

  const ledger = readLedger();
  const account = ledger.accounts[userId] || getOrCreateAccount(userId, username);

  if (!account.banks[bank]) return res.status(400).json({ error: 'Selected bank not active in matrix.' });
  if (!(currency in account.banks[bank].balances)) return res.status(400).json({ error: `Currency ${currency} not supported at ${bank}.` });
  
  if (account.banks[bank].balances[currency] < numAmount) {
    return res.status(400).json({ error: 'Insufficient funds for withdrawal.' });
  }

  // Deduct funds
  account.banks[bank].balances[currency] = parseFloat((account.banks[bank].balances[currency] - numAmount).toFixed(4));
  
  // Log transaction
  const transaction = {
    id: crypto.randomUUID(),
    senderId: userId,
    senderUsername: username,
    senderAccountNumber: account.banks[bank].accountNumber,
    recipientId: 'SYSTEM-TERMINATION',
    recipientUsername: 'ATM Withdrawal / Burn Node',
    recipientAccountNumber: 'SYSTEM-BURN',
    amount: numAmount,
    currency,
    description: `Retrait - ${bank}`,
    timestamp: new Date().toISOString()
  };

  ledger.transactions.push(transaction);
  ledger.accounts[userId] = account;
  writeLedger(ledger);

  res.json({ message: 'Withdrawal successful.', account, transaction });
});

// Interbank Transfer (between user's own banks)
app.post('/api/transactions/transfer-interbank', (req, res) => {
  const userId = req.headers['x-user-id'];
  const username = req.headers['x-user-username'] || 'Client';
  const { sourceBank, destinationBank, amount, currency, description } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID header missing.' });
  if (!sourceBank || !destinationBank || !amount || !currency) {
    return res.status(400).json({ error: 'Source bank, destination bank, amount, and currency are required.' });
  }

  if (sourceBank === destinationBank) {
    return res.status(400).json({ error: 'Source and destination banks must be different.' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Invalid transfer amount.' });

  const ledger = readLedger();
  const account = ledger.accounts[userId] || getOrCreateAccount(userId, username);

  if (!account.banks[sourceBank] || !account.banks[destinationBank]) {
    return res.status(400).json({ error: 'Selected bank portfolios are invalid.' });
  }

  if (account.banks[sourceBank].balances[currency] < numAmount) {
    return res.status(400).json({ error: 'Insufficient funds in source bank.' });
  }

  // Process
  account.banks[sourceBank].balances[currency] = parseFloat((account.banks[sourceBank].balances[currency] - numAmount).toFixed(4));
  account.banks[destinationBank].balances[currency] = parseFloat((account.banks[destinationBank].balances[currency] + numAmount).toFixed(4));

  // Log transaction
  const transaction = {
    id: crypto.randomUUID(),
    senderId: userId,
    senderUsername: `${username} (${sourceBank})`,
    senderAccountNumber: account.banks[sourceBank].accountNumber,
    recipientId: userId,
    recipientUsername: `${username} (${destinationBank})`,
    recipientAccountNumber: account.banks[destinationBank].accountNumber,
    amount: numAmount,
    currency,
    description: description || `Transfert Interbancaire`,
    timestamp: new Date().toISOString()
  };

  ledger.transactions.push(transaction);
  ledger.accounts[userId] = account;
  writeLedger(ledger);

  res.json({ message: 'Interbank transfer successful.', account, transaction });
});

// Transfer Funds to another user's bank account
app.post('/api/transactions/transfer', (req, res) => {
  const senderId = req.headers['x-user-id'];
  const senderUsername = req.headers['x-user-username'] || 'Sender';
  const { sourceBank, recipientAccountNumber, amount, currency, description } = req.body;

  if (!senderId) {
    return res.status(400).json({ error: 'User ID header (x-user-id) missing.' });
  }

  if (!sourceBank || !recipientAccountNumber || !amount || !currency) {
    return res.status(400).json({ error: 'Source bank, recipient account number, amount, and currency are required.' });
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid transfer amount.' });
  }

  const ledger = readLedger();
  const senderAccount = ledger.accounts[senderId] || getOrCreateAccount(senderId, senderUsername);

  if (!senderAccount.banks[sourceBank]) {
    return res.status(400).json({ error: 'Selected source bank not active.' });
  }

  // Check balance
  if (senderAccount.banks[sourceBank].balances[currency] < numAmount) {
    return res.status(400).json({ error: 'Insufficient funds in the selected bank asset portfolio.' });
  }

  // Find recipient account and corresponding bank
  let recipientUserId = null;
  let recipientBankName = null;
  
  for (const uid in ledger.accounts) {
    const acc = ledger.accounts[uid];
    for (const bankName in acc.banks) {
      if (acc.banks[bankName].accountNumber === recipientAccountNumber) {
        recipientUserId = uid;
        recipientBankName = bankName;
        break;
      }
    }
    if (recipientUserId) break;
  }

  // If transferring to self
  if (recipientUserId === senderId) {
    return res.status(400).json({ error: 'Cannot transfer funds to your own account via external wire. Use Interbank Transfer tab.' });
  }

  // Deduct from sender
  senderAccount.banks[sourceBank].balances[currency] = parseFloat((senderAccount.banks[sourceBank].balances[currency] - numAmount).toFixed(4));
  ledger.accounts[senderId] = senderAccount;

  let recipientId = 'external-vault';
  let recipientName = 'External System / Smart Contract';

  if (recipientUserId) {
    const recipientAccount = ledger.accounts[recipientUserId];
    recipientId = recipientUserId;
    recipientName = `${recipientAccount.username} (${recipientBankName})`;
    // Add to recipient
    recipientAccount.banks[recipientBankName].balances[currency] = parseFloat((recipientAccount.banks[recipientBankName].balances[currency] + numAmount).toFixed(4));
    ledger.accounts[recipientId] = recipientAccount;
  }

  const transaction = {
    id: crypto.randomUUID(),
    senderId,
    senderUsername: `${senderUsername} (${sourceBank})`,
    senderAccountNumber: senderAccount.banks[sourceBank].accountNumber,
    recipientId,
    recipientUsername: recipientName,
    recipientAccountNumber,
    amount: numAmount,
    currency,
    description: description || 'Quantum Network Wire',
    timestamp: new Date().toISOString()
  };

  ledger.transactions.push(transaction);
  writeLedger(ledger);

  res.json({
    message: 'Quantum ledger wire transaction cleared successfully.',
    transaction,
    account: senderAccount
  });
});

app.listen(PORT, () => {
  console.log(`Transaction Service listening on port ${PORT}`);
});
