const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  ticketUrl: {
    type: String,
    default: '#'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Tour || mongoose.model('Tour', tourSchema);

