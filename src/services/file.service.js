const fs = require('fs');
const path = require('path');
const prisma = require('../config/database');

/**
 * Records a file upload in the database.
 * @param {object} data
 * @param {string} data.tenantId
 * @param {string} [data.ticketId]
 * @param {string} [data.chatMessageId]
 * @param {string} data.originalName
 * @param {string} data.storedPath
 * @param {string} data.mimeType
 * @param {number} data.sizeBytes
 * @returns {Promise<object>}
 */
const recordFile = async (data) => {
  const file = await prisma.ticketFile.create({
    data: {
      tenantId: data.tenantId,
      ticketId: data.ticketId || null,
      chatMessageId: data.chatMessageId || null,
      originalName: data.originalName,
      storedPath: data.storedPath,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
    },
  });

  return file;
};

/**
 * Gets a file record by ID and verifies tenant ownership.
 * @param {string} fileId
 * @param {string} tenantId
 * @returns {Promise<object|null>}
 */
const getFile = async (fileId, tenantId) => {
  const file = await prisma.ticketFile.findFirst({
    where: { id: fileId, tenantId },
  });

  return file;
};

/**
 * Deletes a file from disk and database.
 * @param {string} fileId
 * @param {string} tenantId
 * @returns {Promise<boolean>}
 */
const deleteFile = async (fileId, tenantId) => {
  const file = await getFile(fileId, tenantId);
  if (!file) return false;

  // Remove from disk
  const fullPath = path.resolve(file.storedPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }

  // Remove from database
  await prisma.ticketFile.delete({ where: { id: fileId } });

  return true;
};

module.exports = { recordFile, getFile, deleteFile };
