const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Album = require('./models/Album');
const Video = require('./models/Video');
const Tour = require('./models/Tour');
const Hero = require('./models/Hero');
const Settings = require('./models/Settings');

// Import database connection
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgmexpa8v',
  api_key: process.env.CLOUDINARY_API_KEY || '577674637224497',
  api_secret: process.env.CLOUDINARY_API_SECRET || '_8Ks_XU3nurQTFUbVA3RxpbcXFE'
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resource_type || 'auto',
      folder: options.folder || 'uploads',
      ...options
    };
    
    // Add upload preset if specified in environment or options
    if (process.env.CLOUDINARY_UPLOAD_PRESET && !options.upload_preset) {
      uploadOptions.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET;
    } else if (options.upload_preset) {
      uploadOptions.upload_preset = options.upload_preset;
    }
    
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images and videos
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit (increased for videos)
  fileFilter: fileFilter
});

// ==================== MUSIC ENDPOINTS ====================

// Get all albums
app.get('/api/music', async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Get single album
app.get('/api/music/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid album ID' });
    }
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Upload album image
app.post('/api/music/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'image',
      folder: 'images/albums',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    });
    res.json({ 
      url: result.secure_url, 
      public_id: result.public_id,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// Create new album
app.post('/api/music', async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const newAlbum = await Album.create({
      title: title || 'Album Title',
      description: description || 'Album description or release date',
      image: image || '/album 1.jpg'
    });
    res.status(201).json(newAlbum);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Update album
app.put('/api/music/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid album ID' });
    }
    const album = await Album.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// Delete album
app.delete('/api/music/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid album ID' });
    }
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// ==================== VIDEO ENDPOINTS ====================

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get single video
app.get('/api/videos/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Upload video file
app.post('/api/videos/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'video',
      folder: 'videos',
      chunk_size: 6000000 // 6MB chunks for large videos
    });
    res.json({ 
      url: result.secure_url, 
      public_id: result.public_id,
      duration: result.duration,
      format: result.format,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'Failed to upload video: ' + error.message });
  }
});

// Create new video
app.post('/api/videos', async (req, res) => {
  try {
    const { title, videoId, youtubeUrl, videoUrl } = req.body;
    
    // If local video URL is provided, use it
    if (videoUrl) {
      const newVideo = await Video.create({
        title: title || 'Video Title',
        videoId: null,
        youtubeUrl: null,
        videoUrl: videoUrl
      });
      return res.status(201).json(newVideo);
    }
    
    // Otherwise, extract video ID from URL if full URL is provided
    let extractedVideoId = videoId;
    if (youtubeUrl && !videoId) {
      const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      extractedVideoId = match ? match[1] : null;
    }
    
    if (!extractedVideoId) {
      return res.status(400).json({ error: 'Video ID or video file is required' });
    }
    
    const newVideo = await Video.create({
      title: title || 'Video Title',
      videoId: extractedVideoId,
      youtubeUrl: youtubeUrl || `https://www.youtube.com/watch?v=${extractedVideoId}`
    });
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Update video
app.put('/api/videos/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    
    // Handle video ID extraction if URL is provided
    if (req.body.youtubeUrl && !req.body.videoId) {
      const match = req.body.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (match) {
        req.body.videoId = match[1];
      }
    }
    
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// ==================== TOUR ENDPOINTS ====================

// Get all tours
app.get('/api/tours', async (req, res) => {
  try {
    const tours = await Tour.find().sort({ date: 1 });
    res.json(tours);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
});

// Get single tour
app.get('/api/tours/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tour ID' });
    }
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json(tour);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tour' });
  }
});

// Create new tour
app.post('/api/tours', async (req, res) => {
  try {
    const { title, location, date, description, ticketUrl } = req.body;
    const newTour = await Tour.create({
      title: title || 'Tour Title',
      location: location || 'Location',
      date: date || new Date(),
      description: description || 'Tour description',
      ticketUrl: ticketUrl || '#'
    });
    res.status(201).json(newTour);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tour' });
  }
});

// Update tour
app.put('/api/tours/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tour ID' });
    }
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json(tour);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tour' });
  }
});

// Delete tour
app.delete('/api/tours/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid tour ID' });
    }
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }
    res.json({ message: 'Tour deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tour' });
  }
});

// ==================== SETTINGS ENDPOINTS ====================

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
app.put('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==================== HERO VIDEO ENDPOINTS ====================

// ==================== HERO VIDEO ENDPOINTS ====================

// Get hero video
app.get('/api/hero', async (req, res) => {
  try {
    const hero = await Hero.getHero();
    res.json(hero);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero video' });
  }
});

// Upload hero video file
app.post('/api/hero/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'video',
      folder: 'videos/hero',
      chunk_size: 6000000 // 6MB chunks for large videos
    });
    res.json({ 
      url: result.secure_url, 
      public_id: result.public_id,
      duration: result.duration,
      format: result.format,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'Failed to upload video: ' + error.message });
  }
});

// Update hero video
app.put('/api/hero', async (req, res) => {
  try {
    const { videoId, youtubeUrl, videoUrl } = req.body;
    
    let heroData = {};
    
    // If local video URL is provided, use it
    if (videoUrl) {
      heroData = {
        videoUrl: videoUrl,
        videoId: null,
        youtubeUrl: null
      };
    } else {
      // Extract video ID from URL if provided
      let extractedVideoId = videoId;
      if (youtubeUrl && (!videoId || !videoId.match(/^[a-zA-Z0-9_-]{11}$/))) {
        const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        if (match) {
          extractedVideoId = match[1];
        }
      }

      if (!extractedVideoId) {
        return res.status(400).json({ error: 'Video ID or video file is required' });
      }

      heroData = {
        videoId: extractedVideoId,
        youtubeUrl: youtubeUrl || `https://www.youtube.com/watch?v=${extractedVideoId}`,
        videoUrl: null
      };
    }

    const hero = await Hero.updateHero(heroData);
    res.json(hero);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hero video' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

