// agents.routes.js
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

router.get('/', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, full_name, email, phone, avatar_url, role, is_active, last_login, created_at,
        listing_count:listings(count),
        enquiry_count:enquiries(count)
      `)
      .in('role', ['agent', 'admin'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ agents: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

router.patch('/:id/status', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { is_active } = req.body;
    const { data, error } = await supabaseAdmin
      .from('users').update({ is_active }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update agent status' });
  }
});

module.exports = router;
