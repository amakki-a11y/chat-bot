const express = require('express');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/helpers');
const { createUploader } = require('../middleware/fileUpload');
const fileService = require('../services/file.service');
const prisma = require('../config/database');

const router = express.Router();

// ─── Routes ───────────────────────────────────────────────────

/**
 * POST /api/files/upload
 * Upload files for the authenticated tenant.
 * Supports optional ticketId and chatMessageId in the body.
 */
router.post(
  '/upload',
  authenticate,
  asyncHandler(async (req, res) => {
    const upload = createUploader(req.tenant);
    const maxFiles = req.tenant.fileConfig?.maxFiles || 5;

    // Promisified multer middleware
    await new Promise((resolve, reject) => {
      upload.array('files', maxFiles)(req, res, (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return reject(createError('File too large', 400));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return reject(createError('Too many files', 400));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return reject(createError('Unexpected file field', 400));
          }
          return reject(createError(err.message || 'Upload error', 400));
        }
        resolve();
      });
    });

    if (!req.files || req.files.length === 0) {
      throw createError('No files uploaded', 400);
    }

    const files = [];
    for (const file of req.files) {
      const record = await fileService.recordFile({
        tenantId: req.tenantId,
        ticketId: req.body.ticketId || null,
        chatMessageId: req.body.chatMessageId || null,
        originalName: file.originalname,
        storedPath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });
      files.push(record);
    }

    res.status(201).json({ files });
  })
);

/**
 * GET /api/files
 * List files for the authenticated tenant with pagination.
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = { tenantId: req.tenantId };
    if (req.query.ticketId) where.ticketId = req.query.ticketId;
    if (req.query.chatMessageId) where.chatMessageId = req.query.chatMessageId;

    const [files, total] = await Promise.all([
      prisma.ticketFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticketFile.count({ where }),
    ]);

    res.json({
      files,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })
);

/**
 * GET /api/files/:id
 * Download/serve a file by ID.
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const file = await fileService.getFile(req.params.id, req.tenantId);
    if (!file) throw createError('File not found', 404);

    const absolutePath = path.resolve(file.storedPath);
    if (!fs.existsSync(absolutePath)) {
      throw createError('File not found on disk', 404);
    }

    res.set('Content-Type', file.mimeType);

    // Inline for images/PDFs, attachment for others
    const inlineTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];
    const disposition = inlineTypes.includes(file.mimeType) ? 'inline' : 'attachment';
    res.set('Content-Disposition', `${disposition}; filename="${file.originalName}"`);

    res.sendFile(absolutePath);
  })
);

/**
 * DELETE /api/files/:id
 * Delete a file from disk and database.
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const deleted = await fileService.deleteFile(req.params.id, req.tenantId);
    if (!deleted) throw createError('File not found', 404);

    res.json({ message: 'File deleted successfully' });
  })
);

module.exports = router;
