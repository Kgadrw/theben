const swaggerJsdoc = require('swagger-jsdoc');

// API Base URL - Use deployment URL
const API_BASE_URL = process.env.API_BASE_URL || process.env.SERVER_URL || 'https://theben.onrender.com';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'The Ben API',
      version: '1.0.0',
      description: 'Backend API documentation for The Ben website. This API provides endpoints for managing music albums, videos, tours, hero video, biography/about, and website settings.',
      contact: {
        name: 'API Support',
        email: 'contact@theben.com'
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      ...(process.env.NODE_ENV === 'production' 
        ? [
            {
              url: process.env.API_BASE_URL || process.env.SERVER_URL || 'https://theben.onrender.com',
              description: 'Production server',
            }
          ]
        : [
            {
              url: 'http://localhost:5000',
              description: 'Development server',
            },
            {
              url: process.env.API_BASE_URL || process.env.SERVER_URL || 'https://theben.onrender.com',
              description: 'Production server',
            }
          ]
      ),
    ],
    tags: [
      {
        name: 'Music',
        description: 'Music albums management endpoints'
      },
      {
        name: 'Videos',
        description: 'Video content management endpoints'
      },
      {
        name: 'Tours',
        description: 'Tour dates and events management endpoints'
      },
      {
        name: 'Hero',
        description: 'Hero video configuration endpoints'
      },
      {
        name: 'Settings',
        description: 'Website settings management endpoints'
      },
      {
        name: 'About',
        description: 'Biography and about section management endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ],
    components: {
      schemas: {
        Album: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Album unique identifier'
            },
            title: {
              type: 'string',
              description: 'Album title',
              example: 'New Album'
            },
            description: {
              type: 'string',
              description: 'Album description or release date',
              example: 'Album description or release date'
            },
            image: {
              type: 'string',
              description: 'Album cover image URL',
              example: 'https://res.cloudinary.com/dgmexpa8v/image/upload/v1/images/albums/image-123'
            },
            hoverImage: {
              type: 'string',
              description: 'Album hover image URL (displayed on hover when user hovers over the album)',
              nullable: true,
              example: 'https://res.cloudinary.com/dgmexpa8v/image/upload/v1/images/albums/hover-image-123'
            },
            link: {
              type: 'string',
              description: 'Listening link URL where users can listen to the music (Spotify, YouTube, Apple Music, etc.)',
              nullable: true,
              example: 'https://open.spotify.com/album/...'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          },
          required: ['title', 'image']
        },
        Video: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Video unique identifier'
            },
            title: {
              type: 'string',
              description: 'Video title'
            },
            videoId: {
              type: 'string',
              description: 'YouTube video ID',
              nullable: true
            },
            youtubeUrl: {
              type: 'string',
              description: 'YouTube video URL',
              nullable: true
            },
            videoUrl: {
              type: 'string',
              description: 'Cloudinary video URL',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Tour: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Tour unique identifier'
            },
            title: {
              type: 'string',
              description: 'Tour title'
            },
            location: {
              type: 'string',
              description: 'Tour location'
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Tour date'
            },
            description: {
              type: 'string',
              description: 'Tour description'
            },
            ticketUrl: {
              type: 'string',
              description: 'Ticket purchase URL'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Hero: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Hero unique identifier'
            },
            videoId: {
              type: 'string',
              description: 'YouTube video ID',
              nullable: true
            },
            youtubeUrl: {
              type: 'string',
              description: 'YouTube video URL',
              nullable: true
            },
            videoUrl: {
              type: 'string',
              description: 'Cloudinary video URL',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Settings: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Settings unique identifier'
            },
            siteTitle: {
              type: 'string',
              description: 'Site title'
            },
            siteDescription: {
              type: 'string',
              description: 'Site description'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Contact email'
            },
            socialMedia: {
              type: 'object',
              properties: {
                facebook: { type: 'string' },
                twitter: { type: 'string' },
                instagram: { type: 'string' },
                youtube: { type: 'string' },
                spotify: { type: 'string' },
                appleMusic: { type: 'string' },
                soundcloud: { type: 'string' }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        About: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'About unique identifier'
            },
            biography: {
              type: 'string',
              description: 'Biography text'
            },
            image: {
              type: 'string',
              description: 'Biography image URL'
            },
            title: {
              type: 'string',
              description: 'Biography title',
              default: 'Biography'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        UploadResponse: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Uploaded file URL'
            },
            public_id: {
              type: 'string',
              description: 'Cloudinary public ID'
            },
            width: {
              type: 'integer',
              description: 'Image/Video width'
            },
            height: {
              type: 'integer',
              description: 'Image/Video height'
            }
          }
        }
      }
    }
  },
  apis: ['./server.js', './routes/*.js'], // Path to the API files
};

module.exports = swaggerJsdoc(options);

