const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 10000;

// Internal URLs (environment variable overrides for Render)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:10001';
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || 'http://localhost:10002';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Logger middleware for routes
app.get('/health', (req, res) => {
  res.json({
    gateway: 'ONLINE',
    auth_service: AUTH_SERVICE_URL,
    transaction_service: TRANSACTION_SERVICE_URL,
    timestamp: new Date()
  });
});

// Authentication verification middleware for Gateway
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  try {
    const verifyResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });

    if (!verifyResponse.ok) {
      const errData = await verifyResponse.json();
      return res.status(verifyResponse.status).json(errData);
    }

    const { user } = await verifyResponse.json();
    req.user = user; // add decoded user { id, username } to request
    next();
  } catch (err) {
    console.error('Auth verification error in gateway:', err.message);
    res.status(500).json({ error: 'Internal Auth Service communication failure.' });
  }
}

// Proxy Auth Service Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Auth Service unavailable.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Auth Service unavailable.' });
  }
});

// Proxy Transaction Service Routes (Authenticated)
app.get('/api/transactions/balance', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/balance`, {
      method: 'GET',
      headers: {
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.get('/api/transactions/history', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/history`, {
      method: 'GET',
      headers: {
        'x-user-id': req.user.id
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/transfer', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/deposit', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/withdraw', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

app.post('/api/transactions/transfer-interbank', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${TRANSACTION_SERVICE_URL}/api/transactions/transfer-interbank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user.id,
        'x-user-username': req.user.username
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Transaction Service unavailable.' });
  }
});

const { exec } = require('child_process');
const path = require('path');

app.post('/api/diagnostics/run-command', authenticateToken, (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required.' });
  }

  // Sanitize command: must run vitest run commands or help/clear (which shouldn't reach here)
  const allowedPrefix = 'npx vitest run';
  if (!command.startsWith(allowedPrefix)) {
    return res.status(400).json({ error: 'Command not authorized. Only "npx vitest run" commands are supported.' });
  }

  const frontendPath = path.resolve(__dirname, '../frontend');

  exec(command, { cwd: frontendPath }, (error, stdout, stderr) => {
    res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      success: !error
    });
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
