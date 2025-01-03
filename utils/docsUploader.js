const cloudinary = require('cloudinary').v2;

exports.uploadDocsToCloudinary = async (file, folder, formatOptions = {}) => {
    const options = { folder };
    options.resouce_type = formatOptions.resource_type || 'raw';

    if(formatOptions.quality) {
        options.quality = formatOptions.quality;
    }

    if(formatOptions.useFilename) {
       options.use_filename = true;
       options.unique_filename = false;
    }

    if(formatOptions.allowedFormats) {
        options.allowedFormats = formatOptions.allowedFormats;
    }

    try{
       const uploadedDocs = await cloudinary.uploader.upload(file.tempFilePath, options);
       console.log('Uploaded Docs:', uploadedDocs);
       res.status(200).json({ 
          success: true,
          message: "Documents uploaded successfully", 
       })
    }catch(err) {
       res.status(500).json({ 
        success: false,
        message: "Error uploading to cloudinary", 
       });
    }

}