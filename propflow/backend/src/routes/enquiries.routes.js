// Enquiries Routes + Controller
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// POST /api/enquiries – public submit
router.post('/',
  optionalAuth,
  [
    body('listing_id').isUUID(),
    body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone(),
    body('message').notEmpty().trim().isLength({ min: 10, max: 2000 }),
    body('viewing_requested').optional().isBoolean(),
    body('viewing_date').optional().isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const { listing_id, name, email, phone, message, viewing_requested, viewing_date } = req.body;

      // Verify listing exists and is active
      const { data: listing } = await supabaseAdmin
        .from('listings')
        .select('id, title, agent_id, status')
        .eq('id', listing_id)
        .single();

      if (!listing || !['active', 'featured'].includes(listing.status)) {
        return res.status(404).json({ error: 'Listing not found or not available' });
      }

      const { data, error } = await supabaseAdmin
        .from('enquiries')
        .insert({
          listing_id,
          agent_id: listing.agent_id,
          user_id: req.user?.id || null,
          name, email, phone: phone || null,
          message, viewing_requested: viewing_requested || false,
          viewing_date: viewing_date || null,
          status: 'unread',
        })
        .select()
        .single();

      if (error) throw error;

      // Increment enquiry count on listing
      await supabaseAdmin.rpc('increment_enquiry_count', { listing_id });

      res.status(201).json({ enquiry: data, message: 'Enquiry submitted successfully' });
    } catch (err) {
      console.error('[submitEnquiry]', err.message);
      res.status(500).json({ error: 'Failed to submit enquiry' });
    }
  }
);

// GET /api/enquiries – admin/agent inbox
router.get('/',
  requireAuth,
  requireRole(['admin', 'agent']),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, listing_id } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let q = supabaseAdmin
        .from('enquiries')
        .select(`
          *, 
          listing:listings(id, title, city, type),
          agent:users!enquiries_agent_id_fkey(id, full_name)
        `, { count: 'exact' });

      if (req.user.role === 'agent') q = q.eq('agent_id', req.user.id);
      if (status)     q = q.eq('status', status);
      if (listing_id) q = q.eq('listing_id', listing_id);

      q = q.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

      const { data, error, count } = await q;
      if (error) throw error;

      res.json({ enquiries: data, pagination: { page: parseInt(page), limit: parseInt(limit), total: count } });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch enquiries' });
    }
  }
);

// PATCH /api/enquiries/:id/status
router.patch('/:id/status',
  requireAuth,
  requireRole(['admin', 'agent']),
  [param('id').isUUID(), body('status').isIn(['unread', 'read', 'in_progress', 'resolved', 'archived'])],
  validate,
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('enquiries')
        .update({ status: req.body.status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select().single();
      if (error) throw error;
      res.json({ enquiry: data });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update enquiry' });
    }
  }
);

module.exports = router;
