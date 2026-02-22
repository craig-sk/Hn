// Listings Controller
const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/listings
 * Public search with filters, pagination, sorting
 */
const getPublicListings = async (req, res) => {
  try {
    const {
      page = 1, limit = 12,
      type, listing_type, location, city,
      min_price, max_price, min_size, max_size,
      sort = 'newest',
      featured_first = true,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('listings')
      .select(`
        id, title, type, listing_type, price, price_unit,
        size_sqm, location, city, province,
        description, images, features, status,
        view_count, enquiry_count, created_at,
        agent:users!listings_agent_id_fkey(id, full_name, avatar_url, phone)
      `, { count: 'exact' })
      .in('status', ['active', 'featured']);

    // Filters
    if (type)         query = query.eq('type', type);
    if (listing_type) query = query.eq('listing_type', listing_type);
    if (city)         query = query.ilike('city', `%${city}%`);
    if (location)     query = query.or(`location.ilike.%${location}%,city.ilike.%${location}%,province.ilike.%${location}%`);
    if (min_price)    query = query.gte('price', parseFloat(min_price));
    if (max_price)    query = query.lte('price', parseFloat(max_price));
    if (min_size)     query = query.gte('size_sqm', parseFloat(min_size));
    if (max_size)     query = query.lte('size_sqm', parseFloat(max_size));

    // Sorting
    switch (sort) {
      case 'price_asc':   query = query.order('price', { ascending: true }); break;
      case 'price_desc':  query = query.order('price', { ascending: false }); break;
      case 'most_viewed': query = query.order('view_count', { ascending: false }); break;
      default:            query = query.order('created_at', { ascending: false });
    }

    // Featured first option
    if (featured_first === 'true' || featured_first === true) {
      query = query.order('status', { ascending: false }); // 'featured' > 'active' alphabetically... use custom
    }

    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Increment view count async (fire & forget)
    if (data && data.length > 0) {
      const ids = data.map(l => l.id);
      supabaseAdmin.rpc('increment_view_counts', { listing_ids: ids }).then(() => {}).catch(() => {});
    }

    res.json({
      listings: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[getPublicListings]', err.message);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

/**
 * GET /api/listings/:id
 * Single listing detail
 */
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *, 
        agent:users!listings_agent_id_fkey(id, full_name, avatar_url, email, phone)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Increment view count
    await supabaseAdmin
      .from('listings')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id);

    res.json({ listing: data });
  } catch (err) {
    console.error('[getListingById]', err.message);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

/**
 * GET /api/listings/admin/all
 * Admin view – all listings with all statuses
 */
const getAdminListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, agent_id, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('listings')
      .select(`
        id, title, type, listing_type, price, size_sqm,
        location, city, status, view_count, enquiry_count,
        created_at, updated_at,
        agent:users!listings_agent_id_fkey(id, full_name, avatar_url)
      `, { count: 'exact' });

    // Agent can only see their own listings
    if (req.user.role === 'agent') {
      query = query.eq('agent_id', req.user.id);
    } else if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (status) query = query.eq('status', status);
    if (search) query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%,city.ilike.%${search}%`);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      listings: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) {
    console.error('[getAdminListings]', err.message);
    res.status(500).json({ error: 'Failed to fetch admin listings' });
  }
};

/**
 * POST /api/listings
 */
const createListing = async (req, res) => {
  try {
    const {
      title, type, listing_type, price, price_unit = 'per_month',
      size_sqm, location, city, province, description,
      features = {}, images = [], agent_id, status = 'draft',
    } = req.body;

    // Agents can only create listings for themselves
    const assignedAgentId = req.user.role === 'admin'
      ? (agent_id || req.user.id)
      : req.user.id;

    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert({
        title, type, listing_type, price, price_unit,
        size_sqm, location, city, province, description,
        features, images,
        agent_id: assignedAgentId,
        status,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ listing: data, message: 'Listing created successfully' });
  } catch (err) {
    console.error('[createListing]', err.message);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

/**
 * PUT /api/listings/:id
 */
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership for agents
    if (req.user.role === 'agent') {
      const { data: existing } = await supabaseAdmin
        .from('listings').select('agent_id').eq('id', id).single();
      if (!existing || existing.agent_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own listings' });
      }
    }

    const allowed = ['title','type','listing_type','price','price_unit','size_sqm',
                     'location','city','province','description','features','images','status'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('listings').update(updates).eq('id', id).select().single();

    if (error) throw error;
    res.json({ listing: data, message: 'Listing updated successfully' });
  } catch (err) {
    console.error('[updateListing]', err.message);
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

/**
 * PATCH /api/listings/:id/status
 */
const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;
    res.json({ listing: data, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

/**
 * PATCH /api/listings/:id/assign
 */
const assignAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { agent_id } = req.body;

    // Verify agent exists
    const { data: agent } = await supabaseAdmin
      .from('users').select('id, full_name, role').eq('id', agent_id).single();
    if (!agent || !['agent', 'admin'].includes(agent.role)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ agent_id, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();

    if (error) throw error;
    res.json({ listing: data, message: `Listing assigned to ${agent.full_name}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign agent' });
  }
};

/**
 * DELETE /api/listings/:id
 */
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('listings').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};

module.exports = {
  getPublicListings, getListingById, getAdminListings,
  createListing, updateListing, updateListingStatus,
  assignAgent, deleteListing,
};
