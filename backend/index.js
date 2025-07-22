const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // dynamic import

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('RingZo backend is running 🎶');
});

app.get('/api/metadata', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

    const response = await fetch(oembedUrl);
    if (!response.ok) {
      throw new Error('YouTube responded with an error');
    }

    const data = await response.json();

    // Return only the needed info
    return res.json({
      title: data.title,
      thumbnail_url: data.thumbnail_url
    });
  } catch (error) {
    console.error('Failed to fetch metadata:', error.message);
    return res.status(500).json({ error: 'Failed to fetch metadata from YouTube' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
