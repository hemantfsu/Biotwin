const AWS = require('aws-sdk');

/**
 * Configured S3 instance for medical image uploads.
 */
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET = process.env.AWS_S3_BUCKET || 'biotwin-uploads';

/**
 * Upload a buffer to S3.
 * @param {Buffer} fileBuffer
 * @param {string} key  — e.g. "xrays/user123/scan.png"
 * @param {string} contentType
 * @returns {Promise<string>} public URL
 */
const uploadToS3 = async (fileBuffer, key, contentType = 'image/png') => {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = { s3, uploadToS3 };
