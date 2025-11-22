const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
  videoId: {
    type: String,
    default: '8ufRrmc6Bj4'
  },
  youtubeUrl: {
    type: String,
    default: 'https://www.youtube.com/watch?v=8ufRrmc6Bj4'
  },
  videoUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Ensure only one hero document exists
heroSchema.statics.getHero = async function() {
  let hero = await this.findOne();
  if (!hero) {
    hero = await this.create({
      videoId: '8ufRrmc6Bj4',
      youtubeUrl: 'https://www.youtube.com/watch?v=8ufRrmc6Bj4'
    });
  }
  return hero;
};

heroSchema.statics.updateHero = async function(data) {
  let hero = await this.findOne();
  if (!hero) {
    hero = await this.create(data);
  } else {
    Object.assign(hero, data);
    await hero.save();
  }
  return hero;
};

module.exports = mongoose.models.Hero || mongoose.model('Hero', heroSchema);

