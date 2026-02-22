// Auth Middleware – validates Supabase JWT tokens
const { supabaseAdmin } = require('../config/supabase');

/**
 * requireAuth – validates Bearer token from Supabase Auth
 * Attaches req.user with id, email, role
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }

    // Fetch user profile with role from our users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, avatar_url, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Unauthorized: User profile not found' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });
    }

    req.user = profile;
    req.token = token;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err.message);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * requireRole – restrict access by role
 * Usage: requireRole('admin') or requireRole(['admin', 'agent'])
 */
const requireRole = (roles) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires role ${allowed.join(' or ')}`,
      });
    }
    next();
  };
};

/**
 * optionalAuth – attaches user if token present, continues if not
 * Used for public routes that show extra data when authenticated
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role, avatar_url')
        .eq('id', user.id)
        .single();
      req.user = profile || null;
    } else {
      req.user = null;
    }
    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { requireAuth, requireRole, optionalAuth };
