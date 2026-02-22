// Listings Routes
const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const listingsController = require('../controllers/listings.controller');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// ── Public Routes ─────────────────────────────
// GET /api/listings – search & filter public listings
router.get('/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('type').optional().isIn(['office', 'industrial', 'retail', 'warehouse', 'mixed_use', 'agricultural']),
    query('listing_type').optional().isIn(['to_let', 'for_sale']),
    query('min_price').optional().isNumeric(),
    query('max_price').optional().isNumeric(),
    query('min_size').optional().isNumeric(),
    query('max_size').optional().isNumeric(),
    query('location').optional().isString(),
    query('sort').optional().isIn(['price_asc', 'price_desc', 'newest', 'most_viewed']),
  ],
  validate,
  listingsController.getPublicListings
);

// GET /api/listings/:id – single public listing
router.get('/:id',
  optionalAuth,
  param('id').isUUID(),
  validate,
  listingsController.getListingById
);

// ── Protected Routes (Agent / Admin) ──────────
// GET /api/listings/admin/all – admin view with all statuses
router.get('/admin/all',
  requireAuth,
  requireRole(['admin', 'agent']),
  listingsController.getAdminListings
);

// POST /api/listings – create listing
router.post('/',
  requireAuth,
  requireRole(['admin', 'agent']),
  [
    body('title').notEmpty().trim().isLength({ min: 5, max: 200 }),
    body('type').isIn(['office', 'industrial', 'retail', 'warehouse', 'mixed_use', 'agricultural']),
    body('listing_type').isIn(['to_let', 'for_sale']),
    body('price').isNumeric({ min: 0 }),
    body('size_sqm').isNumeric({ min: 1 }),
    body('location').notEmpty().trim(),
    body('city').notEmpty().trim(),
    body('province').notEmpty().trim(),
    body('description').optional().isString(),
    body('agent_id').optional().isUUID(),
  ],
  validate,
  listingsController.createListing
);

// PUT /api/listings/:id – update listing
router.put('/:id',
  requireAuth,
  requireRole(['admin', 'agent']),
  param('id').isUUID(),
  validate,
  listingsController.updateListing
);

// PATCH /api/listings/:id/status – change status
router.patch('/:id/status',
  requireAuth,
  requireRole(['admin', 'agent']),
  [
    param('id').isUUID(),
    body('status').isIn(['draft', 'active', 'featured', 'pending', 'let', 'sold', 'archived']),
  ],
  validate,
  listingsController.updateListingStatus
);

// PATCH /api/listings/:id/assign – assign to agent
router.patch('/:id/assign',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID(),
    body('agent_id').isUUID(),
  ],
  validate,
  listingsController.assignAgent
);

// DELETE /api/listings/:id
router.delete('/:id',
  requireAuth,
  requireRole(['admin']),
  param('id').isUUID(),
  validate,
  listingsController.deleteListing
);

module.exports = router;
