const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Video Title'
  },
  videoId: {
    type: String,
    default: null
  },
  youtubeUrl: {
    type: String,
    default: null
  },
  videoUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Video || mongoose.model('Video', videoSchema);

