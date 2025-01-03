const cloudinary = require('cloudinary').v2;

exports.uploadDocsToCloudinary = async (file, folder, formatOptions = {}) => {
  const options = { folder };
  options.resource_type = formatOptions.resourceType || 'raw'; // Fixed typo

  if (formatOptions.quality) {
    options.quality = formatOptions.quality;
  }

  if (formatOptions.useFilename) {
    options.use_filename = true;
    options.unique_filename = false;
  }

  if (formatOptions.allowedFormats) {
    options.allowed_formats = formatOptions.allowedFormats; // Ensure correct spelling
  }

  try {
    // Upload file to Cloudinary
    const uploadedDocs = await cloudinary.uploader.upload(file.tempFilePath, options);
    console.log('Uploaded Docs:', uploadedDocs);

    // Return the result to the calling function
    return uploadedDocs;
  } catch (err) {
    console.error('Error uploading to Cloudinary:', err);
    // Throw the error to be handled by the calling function
    throw new Error('Error uploading to Cloudinary');
  }
};
