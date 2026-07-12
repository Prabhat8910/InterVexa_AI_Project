import cloudinary from '../config/cloudinary';

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'intervexa',
  resourceType: 'auto' | 'raw' | 'image' = 'auto'
): Promise<string> => {
  try {
    // Fallback if credentials are not configured or are placeholders
    if (
      !process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY.includes('your_cloudinary') ||
      process.env.CLOUDINARY_CLOUD_NAME.includes('your_cloudinary')
    ) {
      console.warn('[Cloudinary Service] Config missing or placeholder. Simulating mock file upload.');
      return 'https://res.cloudinary.com/demo/image/upload/v1620000000/sample_report.pdf';
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary Service] Upload stream error:', error);
            reject(error);
          } else {
            resolve(result?.secure_url || '');
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('[Cloudinary Service] Upload failure:', error);
    throw error;
  }
};
export default uploadToCloudinary;
