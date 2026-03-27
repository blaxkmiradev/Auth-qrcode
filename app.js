const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config();

const app = express();

// In-memory user store (replace with DB in production)
const users = {};

// User limit — set via .env MAX_USERS or default 10
const MAX_USERS = parseInt(process.env.MAX_USERS) || 10;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// Middleware: require login
function requireLogin(req, res, next) {
  if (req.session.userId && req.session.verified) return next();
  res.redirect('/login');
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Home → redirect
app.get('/', (req, res) => {
  if (req.session.userId && req.session.verified) return res.redirect('/dashboard');
  res.redirect('/login');
});

// Register
app.get('/register', (req, res) => {
  const userCount = Object.keys(users).length;
  if (userCount >= MAX_USERS)
    return res.render('register', { error: `Registration closed. Maximum ${MAX_USERS} users reached.` });
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.render('register', { error: 'All fields required.' });
  if (Object.keys(users).length >= MAX_USERS)
    return res.render('register', { error: `Registration closed. Maximum ${MAX_USERS} users reached.` });
  if (users[username])
    return res.render('register', { error: 'Username already exists.' });

  const hash = await bcrypt.hash(password, 10);
  // Generate TOTP secret
  const secret = speakeasy.generateSecret({ name: `SecureApp (${username})`, length: 20 });
  users[username] = { password: hash, secret: secret.base32, totpEnabled: false };

  // Generate QR code data URL
  const qrDataURL = await QRCode.toDataURL(secret.otpauth_url);
  req.session.pendingUser = username;
  res.render('setup-totp', { qrDataURL, secretKey: secret.base32, error: null });
});

// Setup TOTP — verify code after scanning
app.post('/setup-totp', (req, res) => {
  const { token } = req.body;
  const username = req.session.pendingUser;
  if (!username || !users[username]) return res.redirect('/register');

  const verified = speakeasy.totp.verify({
    secret: users[username].secret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!verified) {
    QRCode.toDataURL(
      speakeasy.otpauthURL({ secret: users[username].secret, label: `SecureApp (${username})`, encoding: 'base32' }),
      (err, qrDataURL) => {
        res.render('setup-totp', { qrDataURL, secretKey: users[username].secret, error: 'Invalid code. Try again.' });
      }
    );
    return;
  }

  users[username].totpEnabled = true;
  delete req.session.pendingUser;
  req.session.userId = username;
  req.session.verified = true;
  res.redirect('/dashboard');
});

// Login
app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) return res.render('login', { error: 'Invalid username or password.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.render('login', { error: 'Invalid username or password.' });

  req.session.userId = username;
  req.session.verified = false;
  res.redirect('/verify');
});

// Verify TOTP
app.get('/verify', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('verify', { error: null });
});

app.post('/verify', (req, res) => {
  const { token } = req.body;
  const username = req.session.userId;
  if (!username || !users[username]) return res.redirect('/login');

  const verified = speakeasy.totp.verify({
    secret: users[username].secret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!verified) return res.render('verify', { error: 'Invalid code. Please try again.' });

  req.session.verified = true;
  res.redirect('/dashboard');
});

// Dashboard
app.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', { username: req.session.userId });
});

// API: stats (user count / limit)
app.get('/api/stats', requireLogin, (req, res) => {
  res.json({
    userCount: Object.keys(users).length,
    maxUsers: MAX_USERS
  });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
