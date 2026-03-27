# SecureApp - Express.js TOTP Authentication

A secure web application with QR code-based two-factor authentication (TOTP) using Express.js and Bootstrap 5.

## Features

- 🔐 User registration with password hashing (bcrypt)
- 📱 QR code generation for authenticator apps (Google Authenticator, Authy, etc.)
- 🔑 TOTP verification on login
- 🎨 Clean Bootstrap 5 UI
- 🚀 Session management

## Installation

1. Extract the ZIP file
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Run the server:
```bash
npm start
```

5. Open browser: `http://localhost:3000`

## Usage Flow

1. **Register** → Create account with username/password
2. **Scan QR** → Use Google Authenticator/Authy to scan the QR code
3. **Verify** → Enter the 6-digit code from your app
4. **Dashboard** → You're in! 
5. **Logout/Login** → Next time, you'll need the TOTP code again

## Tech Stack

- Express.js
- EJS templates
- Bootstrap 5
- speakeasy (TOTP)
- qrcode
- bcryptjs
- express-session

## Security Notes

- Change `SESSION_SECRET` in `.env` for production
- Use HTTPS in production
- Consider adding rate limiting
- Store users in a real database (not in-memory)
