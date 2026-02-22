// uploads.routes.js – S3 presigned URL generation
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { v4: uuidv4 } = require('uuid');

// POST /api/uploads/presign – get S3 presigned URL
router.post('/presign', requireAuth, async (req, res) => {
  try {
    const { filename, contentType, folder = 'listings' } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType required' });
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(contentType)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }

    const key = `${folder}/${uuidv4()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // NOTE: In production, use AWS SDK v3 to generate presigned URL
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    // const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    // const s3 = new S3Client({ region: process.env.AWS_REGION });
    // const command = new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key, ContentType: contentType });
    // const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Placeholder response for local dev without AWS
    res.json({
      presigned_url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      public_url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key,
      note: 'Configure AWS SDK for production S3 uploads',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

module.exports = router;
