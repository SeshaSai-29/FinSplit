import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate JWT Helper (10-day expiry as requested)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_finance_tracker_key_2026_finance_tracker', {
    expiresIn: '10d'
  });
};

// @route   GET /api/auth/google
// @desc    Redirect to Google OAuth 2.0 authorization endpoint
// @access  Public
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

  if (!clientId || clientId === 'your_google_client_id_here') {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Google OAuth is not configured yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env')}`);
  }

  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
  
  // Google OAuth 2.0 endpoint requesting openid, email, and profile
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  }).toString();

  res.redirect(googleAuthUrl);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth 2.0 callback handler (exchanges code, retrieves user, creates/links user, returns JWT)
// @access  Public
router.get('/google/callback', async (req, res) => {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const { code, error } = req.query;

  // Handle errors from Google consent screen
  if (error) {
    console.error('Google OAuth error from consent screen:', error);
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(`Google Sign-In failed or was cancelled: ${error}`)}`);
  }

  if (!code) {
    return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('No authorization code received from Google')}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for access and ID tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code.toString(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      const errMsg = tokenData.error_description || tokenData.error || 'Failed to exchange authorization code with Google';
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(errMsg)}`);
    }

    // 2. Fetch user profile from Google OpenID Connect userinfo endpoint
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const googleUser = await userinfoResponse.json();

    if (!userinfoResponse.ok || !googleUser.email) {
      console.error('Failed to fetch userinfo from Google:', googleUser);
      return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Could not retrieve email address from your Google profile')}`);
    }

    const email = googleUser.email.toLowerCase().trim();
    const googleId = googleUser.sub;
    const name = googleUser.name || googleUser.given_name || email.split('@')[0];
    const avatar = googleUser.picture || '';

    // 3. Database handling:
    // If email doesn't exist, create user without password (password is optional for Google users).
    // If email exists, update/link Google ID if needed and log in.
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        authProvider: 'google',
        groupIds: []
      });
      console.log('Created new Google OAuth user:', user.email);
    } else {
      let shouldSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
      console.log('Logged in existing user with Google OAuth:', user.email);
    }

    // 4. Generate JWT token with 10-day validity
    const token = generateToken(user.id);

    // 5. Redirect user back to frontend with the token
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Error during Google OAuth callback processing:', err);
    res.redirect(`${clientUrl}/login?error=${encodeURIComponent('Internal server error during Google Sign-In')}`);
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      groupIds: [] // Starts with empty list of groups
    });

    if (user) {
      res.status(201).json({
        token: generateToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          authProvider: user.authProvider || 'local',
          groupIds: user.groupIds,
          monthlyBudgetLimit: user.monthlyBudgetLimit || 0,
          categoryBudgets: user.categoryBudgets || []
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter both email and password' });
  }
  
  try {
    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        token: generateToken(user.id),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          authProvider: user.authProvider || 'local',
          groupIds: user.groupIds,
          monthlyBudgetLimit: user.monthlyBudgetLimit || 0,
          categoryBudgets: user.categoryBudgets || []
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      authProvider: user.authProvider || 'local',
      groupIds: user.groupIds,
      monthlyBudgetLimit: user.monthlyBudgetLimit || 0,
      categoryBudgets: user.categoryBudgets || []
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

export default router;
