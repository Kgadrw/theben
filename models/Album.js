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
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Album || mongoose.model('Album', albumSchema);

