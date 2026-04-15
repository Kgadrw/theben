const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      required: true,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'News',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

newsSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

module.exports = mongoose.models.News || mongoose.model('News', newsSchema);

