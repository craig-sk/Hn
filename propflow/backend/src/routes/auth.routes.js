// Auth Routes
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// POST /api/auth/register (admin creates agents)
router.post('/register',
  requireAuth,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').notEmpty().trim(),
    body('role').isIn(['admin', 'agent']),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, full_name, role, phone } = req.body;

      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email, password,
        email_confirm: true,
        user_metadata: { full_name, role },
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }

      // Create user profile in our users table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email, full_name, role,
          phone: phone || null,
          is_active: true,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      res.status(201).json({
        message: 'User created successfully',
        user: { id: profile.id, email: profile.email, full_name: profile.full_name, role: profile.role },
      });
    } catch (err) {
      console.error('[register]', err.message);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

      if (error) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, avatar_url, phone, is_active')
        .eq('id', data.user.id)
        .single();

      if (!profile?.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Update last login
      await supabaseAdmin.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);

      res.json({
        user: profile,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      });
    } catch (err) {
      console.error('[login]', err.message);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await supabaseAdmin.auth.admin.signOut(req.token);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.json({ message: 'Logged out' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Invalid refresh token' });

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password',
  body('email').isEmail().normalizeEmail(),
  validate,
  async (req, res) => {
    try {
      await supabaseAdmin.auth.resetPasswordForEmail(req.body.email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });
      res.json({ message: 'Password reset email sent if account exists' });
    } catch (err) {
      res.json({ message: 'Password reset email sent if account exists' });
    }
  }
);

module.exports = router;
