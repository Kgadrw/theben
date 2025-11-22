const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
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

/**
 * @swagger
 * /api/music:
 *   get:
 *     summary: Get all albums
 *     tags: [Music]
 *     responses:
 *       200:
 *         description: List of all albums
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Album'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/music', async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

/**
 * @swagger
 * /api/music/{id}:
 *   get:
 *     summary: Get a single album by ID
 *     tags: [Music]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Album'
 *       400:
 *         description: Invalid album ID
 *       404:
 *         description: Album not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/music/upload:
 *   post:
 *     summary: Upload album cover image
 *     tags: [Music]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: Album cover image file (JPG, PNG, GIF, WebP)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Upload failed
 */
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

/**
 * @swagger
 * /api/music:
 *   post:
 *     summary: Create a new album
 *     tags: [Music]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Album"
 *               description:
 *                 type: string
 *                 example: "Album description or release date"
 *               image:
 *                 type: string
 *                 example: "https://res.cloudinary.com/dgmexpa8v/image/upload/v1/images/albums/image-123"
 *     responses:
 *       201:
 *         description: Album created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Album'
 *       500:
 *         description: Failed to create album
 */
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

/**
 * @swagger
 * /api/music/{id}:
 *   put:
 *     summary: Update an album
 *     tags: [Music]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Album ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Album updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Album'
 *       400:
 *         description: Invalid album ID
 *       404:
 *         description: Album not found
 *       500:
 *         description: Failed to update album
 */
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

/**
 * @swagger
 * /api/music/{id}:
 *   delete:
 *     summary: Delete an album
 *     tags: [Music]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Album ID
 *     responses:
 *       200:
 *         description: Album deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Album deleted successfully"
 *       400:
 *         description: Invalid album ID
 *       404:
 *         description: Album not found
 *       500:
 *         description: Failed to delete album
 */
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

/**
 * @swagger
 * /api/videos:
 *   get:
 *     summary: Get all videos
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: List of all videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Video'
 *       500:
 *         description: Server error
 */
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get a single video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       400:
 *         description: Invalid video ID
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload video file
 *     tags: [Videos]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: video
 *         type: file
 *         required: true
 *         description: Video file (MP4, MOV, AVI, WebM, max 200MB)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Upload failed
 */
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

/**
 * @swagger
 * /api/videos:
 *   post:
 *     summary: Create a new video
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Video"
 *               videoId:
 *                 type: string
 *                 example: "8ufRrmc6Bj4"
 *                 description: YouTube video ID (required if videoUrl not provided)
 *               youtubeUrl:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=8ufRrmc6Bj4"
 *                 description: YouTube video URL (required if videoUrl not provided)
 *               videoUrl:
 *                 type: string
 *                 example: "https://res.cloudinary.com/dgmexpa8v/video/upload/v1/videos/video-123"
 *                 description: Cloudinary video URL (required if videoId not provided)
 *     responses:
 *       201:
 *         description: Video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       400:
 *         description: Video ID or video file is required
 *       500:
 *         description: Failed to create video
 */
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

/**
 * @swagger
 * /api/videos/{id}:
 *   put:
 *     summary: Update a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               videoId:
 *                 type: string
 *               youtubeUrl:
 *                 type: string
 *               videoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       400:
 *         description: Invalid video ID
 *       404:
 *         description: Video not found
 *       500:
 *         description: Failed to update video
 */
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

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video deleted successfully"
 *       400:
 *         description: Invalid video ID
 *       404:
 *         description: Video not found
 *       500:
 *         description: Failed to delete video
 */
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

/**
 * @swagger
 * /api/tours:
 *   get:
 *     summary: Get all tours
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: List of all tours
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tour'
 *       500:
 *         description: Server error
 */
app.get('/api/tours', async (req, res) => {
  try {
    const tours = await Tour.find().sort({ date: 1 });
    res.json(tours);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
});

/**
 * @swagger
 * /api/tours/{id}:
 *   get:
 *     summary: Get a single tour by ID
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tour'
 *       400:
 *         description: Invalid tour ID
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/tours:
 *   post:
 *     summary: Create a new tour
 *     tags: [Tours]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Concert with Bruce Melodie"
 *               location:
 *                 type: string
 *                 example: "Rwanda"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-26"
 *               description:
 *                 type: string
 *                 example: "Highly anticipated concert"
 *               ticketUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://tickets.example.com"
 *     responses:
 *       201:
 *         description: Tour created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tour'
 *       500:
 *         description: Failed to create tour
 */
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

/**
 * @swagger
 * /api/tours/{id}:
 *   put:
 *     summary: Update a tour
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               ticketUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Tour updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tour'
 *       400:
 *         description: Invalid tour ID
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Failed to update tour
 */
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

/**
 * @swagger
 * /api/tours/{id}:
 *   delete:
 *     summary: Delete a tour
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tour ID
 *     responses:
 *       200:
 *         description: Tour deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tour deleted successfully"
 *       400:
 *         description: Invalid tour ID
 *       404:
 *         description: Tour not found
 *       500:
 *         description: Failed to delete tour
 */
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

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get website settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       500:
 *         description: Server error
 */
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update website settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               siteTitle:
 *                 type: string
 *                 example: "Theben | Official Website"
 *               siteDescription:
 *                 type: string
 *                 example: "Official website for theben"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "contact@theben.com"
 *               socialMedia:
 *                 type: object
 *                 properties:
 *                   facebook:
 *                     type: string
 *                   twitter:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   youtube:
 *                     type: string
 *                   spotify:
 *                     type: string
 *                   appleMusic:
 *                     type: string
 *                   soundcloud:
 *                     type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 *       500:
 *         description: Failed to update settings
 */
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

/**
 * @swagger
 * /api/hero:
 *   get:
 *     summary: Get hero video configuration
 *     tags: [Hero]
 *     responses:
 *       200:
 *         description: Hero video configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hero'
 *       500:
 *         description: Server error
 */
app.get('/api/hero', async (req, res) => {
  try {
    const hero = await Hero.getHero();
    res.json(hero);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero video' });
  }
});

/**
 * @swagger
 * /api/hero/upload:
 *   post:
 *     summary: Upload hero video file
 *     tags: [Hero]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: video
 *         type: file
 *         required: true
 *         description: Hero video file (MP4, MOV, AVI, WebM, max 200MB)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Upload failed
 */
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

/**
 * @swagger
 * /api/hero:
 *   put:
 *     summary: Update hero video configuration
 *     tags: [Hero]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: string
 *                 example: "8ufRrmc6Bj4"
 *                 description: YouTube video ID (required if videoUrl not provided)
 *               youtubeUrl:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=8ufRrmc6Bj4"
 *                 description: YouTube video URL (required if videoUrl not provided)
 *               videoUrl:
 *                 type: string
 *                 example: "https://res.cloudinary.com/dgmexpa8v/video/upload/v1/videos/hero/video-123"
 *                 description: Cloudinary video URL (required if videoId not provided)
 *     responses:
 *       200:
 *         description: Hero video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hero'
 *       400:
 *         description: Video ID or video file is required
 *       500:
 *         description: Failed to update hero video
 */
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

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "API is running"
 */
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
  console.log(`Swagger API documentation available at http://localhost:${PORT}/api-docs`);
});

