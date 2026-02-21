const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Creates a multer upload instance configured for a specific tenant's settings.
 * @param {object} tenant - Tenant record with fileConfig
 * @returns {multer.Multer}
 */
const createUploader = (tenant) => {
  const fileConfig = tenant.fileConfig || {};
  const maxSizeBytes = (fileConfig.maxSizeMb || 10) * 1024 * 1024;
  const allowedTypes = fileConfig.allowedTypes || [
    'image/png',
    'image/jpeg',
    'application/pdf',
    'text/plain',
  ];

  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const now = new Date();
  const tenantDir = path.join(
    uploadDir,
    tenant.id,
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0')
  );

  // Ensure directory exists
  fs.mkdirSync(tenantDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, tenantDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

  const fileFilter = (_req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  };

  return multer({
    storage,
    limits: {
      fileSize: maxSizeBytes,
      files: fileConfig.maxFiles || 5,
    },
    fileFilter,
  });
};

module.exports = { createUploader };
