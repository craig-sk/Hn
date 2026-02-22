// Analytics Routes
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

// GET /api/analytics/dashboard
router.get('/dashboard', requireAuth, requireRole(['admin', 'agent']), async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const listingFilter = isAdmin ? {} : { agent_id: userId };

    // Run queries in parallel
    const [
      listingsResult,
      enquiriesResult,
      agentsResult,
      recentEnquiriesResult,
      listingsByTypeResult,
      monthlyEnquiriesResult,
    ] = await Promise.all([
      // Total listings by status
      supabaseAdmin.from('listings').select('status', { count: 'exact' })
        .match(listingFilter),

      // Total enquiries
      supabaseAdmin.from('enquiries').select('status', { count: 'exact' })
        .match(isAdmin ? {} : { agent_id: userId }),

      // Active agents (admin only)
      isAdmin
        ? supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('role', 'agent').eq('is_active', true)
        : Promise.resolve({ count: null }),

      // Recent 5 enquiries
      supabaseAdmin.from('enquiries')
        .select(`id, name, email, message, status, created_at, listing:listings(id, title, city)`)
        .match(isAdmin ? {} : { agent_id: userId })
        .order('created_at', { ascending: false })
        .limit(5),

      // Listings by type
      supabaseAdmin.from('listings')
        .select('type')
        .match({ ...listingFilter, status: 'active' }),

      // Enquiries per month (last 6 months)
      supabaseAdmin.from('enquiries')
        .select('created_at')
        .match(isAdmin ? {} : { agent_id: userId })
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Process listings by type
    const typeMap = {};
    (listingsByTypeResult.data || []).forEach(l => {
      typeMap[l.type] = (typeMap[l.type] || 0) + 1;
    });

    // Process monthly enquiries
    const monthlyMap = {};
    (monthlyEnquiriesResult.data || []).forEach(e => {
      const month = new Date(e.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });

    res.json({
      kpis: {
        total_listings: listingsResult.count || 0,
        active_listings: (listingsResult.data || []).filter(l => l.status === 'active').length,
        featured_listings: (listingsResult.data || []).filter(l => l.status === 'featured').length,
        total_enquiries: enquiriesResult.count || 0,
        unread_enquiries: (enquiriesResult.data || []).filter(e => e.status === 'unread').length,
        active_agents: agentsResult.count,
      },
      recent_enquiries: recentEnquiriesResult.data || [],
      listings_by_type: typeMap,
      monthly_enquiries: monthlyMap,
    });
  } catch (err) {
    console.error('[analytics/dashboard]', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/top-listings
router.get('/top-listings', requireAuth, requireRole(['admin', 'agent']), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('id, title, city, view_count, enquiry_count, status')
      .order('view_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ listings: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top listings' });
  }
});

module.exports = router;
