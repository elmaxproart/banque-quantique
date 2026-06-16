const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10001;
const JWT_SECRET = process.env.JWT_SECRET || 'quantum-core-secret-key-1099';
const DB_PATH = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ensure DB file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

// Helpers
function readUsers() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Routes
app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'ONLINE', timestamp: new Date() });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password and email are required.' });
  }

  const users = readUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username already registered.' });
  }
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = hashPassword(password, salt);

  const newUser = {
    id: crypto.randomUUID(),
    username,
    email,
    salt,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  // Auto-create default account in transaction-service later via API gateway or let gateway orchestrate it,
  // or return the user info and token immediately.
  const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '24h' });

  res.status(201).json({
    message: 'User registered successfully.',
    token,
    user: { id: newUser.id, username: newUser.username, email: newUser.email }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const users = readUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.password) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    message: 'Login successful.',
    token,
    user: { id: user.id, username: user.username, email: user.email }
  });
});

// Verify JWT
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service listening on port ${PORT}`);
});
