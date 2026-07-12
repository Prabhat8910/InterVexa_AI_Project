import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret && !apiKey.includes('your_cloudinary') && !cloudName.includes('your_cloudinary')) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn("WARNING: Cloudinary configuration is incomplete. Resume uploads will run in mock mode.");
}

export default cloudinary;
