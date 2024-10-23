const express = require('express');
const { uploadVideo, getVideos } = require('../controllers/videoController');

const router = express.Router();
const upload = require('multer')({ dest: 'uploads/' });

router.post('/upload', upload.single('video'), uploadVideo);
router.get('/', getVideos);

module.exports = router;
