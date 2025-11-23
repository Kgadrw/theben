const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Album Title'
  },
  description: {
    type: String,
    default: 'Album description or release date'
  },
  image: {
    type: String,
    required: true,
    default: '/album 1.jpg'
  },
  hoverImage: {
    type: String,
    default: null
  },
  link: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Album || mongoose.model('Album', albumSchema);

