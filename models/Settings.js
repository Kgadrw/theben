const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteTitle: {
    type: String,
    default: 'Theben | Official Website'
  },
  siteDescription: {
    type: String,
    default: 'Official website for theben'
  },
  email: {
    type: String,
    default: 'contact@theben.com'
  },
  socialMedia: {
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    spotify: { type: String, default: '' },
    appleMusic: { type: String, default: '' },
    soundcloud: { type: String, default: '' }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      siteTitle: 'Theben | Official Website',
      siteDescription: 'Official website for theben',
      email: 'contact@theben.com',
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: '',
        spotify: '',
        appleMusic: '',
        soundcloud: ''
      }
    });
  }
  return settings;
};

module.exports = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

