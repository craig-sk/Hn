// AI Chat Route – powered by Anthropic Claude
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Anthropic = require('@anthropic-ai/sdk');
const { supabaseAdmin } = require('../config/supabase');
const { optionalAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const rateLimit = require('express-rate-limit');

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many chat requests. Please slow down.' },
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are PropFlow's AI Property Advisor — a knowledgeable, friendly assistant for a South African commercial real estate platform.

You help users:
- Find suitable commercial properties (offices, warehouses, retail, industrial)
- Understand lease terms, pricing, and market conditions in South Africa
- Schedule viewings and submit enquiries
- Explain the difference between "to let" and "for sale" properties
- Navigate the platform features

South African context:
- Prices are in ZAR (South African Rand)
- Major markets: Sandton, Cape Town CBD, Century City, Claremont, Midrand, Menlyn, Umhlanga, Durban, Pretoria
- Typical office leases: 3–5 year terms, escalation clauses of 7–10% per year
- GLA (Gross Leasable Area) is the standard size metric
- Common property types: Grade A/B offices, industrial/logistics, retail strips, mixed-use

Guidelines:
- Be concise and helpful (2–3 paragraphs max)
- Use bold for key terms or figures
- If asked for specific listings, invite them to use the search feature or chat with an agent
- Never invent specific prices or availability — direct them to search or contact an agent
- For legal or contractual questions, always recommend consulting a registered property practitioner
- You can help with enquiries, but encourage users to submit through the platform for tracking`;

// POST /api/chat
router.post('/',
  chatLimiter,
  optionalAuth,
  [
    body('messages').isArray({ min: 1, max: 50 }),
    body('messages.*.role').isIn(['user', 'assistant']),
    body('messages.*.content').isString().notEmpty().isLength({ max: 4000 }),
    body('listing_context').optional().isUUID(),
  ],
  validate,
  async (req, res) => {
    try {
      const { messages, listing_context } = req.body;

      let systemPrompt = SYSTEM_PROMPT;

      // Enrich system prompt with listing context if provided
      if (listing_context) {
        const { data: listing } = await supabaseAdmin
          .from('listings')
          .select('title, type, listing_type, price, size_sqm, location, city, description, features')
          .eq('id', listing_context)
          .single();

        if (listing) {
          systemPrompt += `\n\nCurrent listing context the user is viewing:\n` +
            `Title: ${listing.title}\n` +
            `Type: ${listing.type} | ${listing.listing_type}\n` +
            `Price: R${listing.price?.toLocaleString()} per month\n` +
            `Size: ${listing.size_sqm}m²\n` +
            `Location: ${listing.location}, ${listing.city}\n` +
            `Description: ${listing.description || 'Not provided'}\n` +
            `Features: ${JSON.stringify(listing.features || {})}`;
        }
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });

      const reply = response.content[0]?.text || 'I apologize, I could not generate a response. Please try again.';

      // Log chat for analytics (async)
      supabaseAdmin.from('chat_logs').insert({
        user_id: req.user?.id || null,
        listing_id: listing_context || null,
        message_count: messages.length,
        last_user_message: messages[messages.length - 1]?.content?.substring(0, 500),
        tokens_used: response.usage?.output_tokens || 0,
      }).then(() => {}).catch(() => {});

      res.json({ reply, usage: response.usage });
    } catch (err) {
      console.error('[Chat Error]', err.message);
      if (err.status === 429) {
        return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' });
      }
      res.status(500).json({ error: 'Chat service unavailable. Please try again.' });
    }
  }
);

module.exports = router;
