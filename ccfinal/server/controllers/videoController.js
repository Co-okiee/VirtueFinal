const Video = require('../models/Video');
// console.log('User details:', req.user);

const uploadVideo = async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
  
    console.log('File details:', req.file);  // Log file details to verify multer is working
  
    const newVideo = new Video({
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user ? req.user.id : null  // Temporarily set to null to isolate issues
    });
  
    await newVideo.save();
    res.status(201).json({ message: 'Video uploaded successfully' });
  };
  

const getVideos = async (req, res) => {
  const videos = await Video.find().populate('uploadedBy');
  res.json(videos);
};

module.exports = { uploadVideo, getVideos };
