const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.uploadDocsToCloudinary = async (file, folder, formatOptions = {}) => {
  const allowedExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  // Extract the file extension
  const fileExtension = file.name.split('.').pop().toLowerCase();
  // console.log('kya be kaise ho', fileExtension);

  // Validate file extension
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(`Unsupported file type. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }
  const fileName = path.basename(file.name, path.extname(file.name)); // Get the base name without extension
  let publicIdWithExtension;
   publicIdWithExtension = `${fileName}.${fileExtension}`;
  
  const options = {
    folder,
    resource_type: 'raw', // Needed for non-image files
    public_id: publicIdWithExtension,
  };
  
  if (formatOptions.useFilename) {
    options.use_filename = true;
    options.unique_filename = false;
  }
  
  try {
    // Upload the file to Cloudinary
    const uploadedDocs = await cloudinary.uploader.upload(file.tempFilePath, options);
    // console.log('Uploaded Docs:', uploadedDocs);

    // Return the result to the calling function
    return uploadedDocs;
  } catch (err) {
    // console.error('Error uploading to Cloudinary:', err);
    throw new Error(err.message || 'Error uploading to Cloudinary');
  }
};
