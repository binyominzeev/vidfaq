import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.post('/api/fetch-thumbnail', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  // Use a unique filename based on video ID or timestamp
  const outputDir = path.join(__dirname, 'thumbnails');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // yt-dlp will save thumbnail as [video-id].[ext]
  exec(`yt-dlp --skip-download --write-thumbnail --output "${outputDir}/%(id)s.%(ext)s" "${url}"`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: 'yt-dlp failed', details: stderr });

    // Find the thumbnail file in outputDir
    fs.readdir(outputDir, (err, files) => {
      if (err) return res.status(500).json({ error: 'Failed to read thumbnails' });
      const thumb = files.find(f => f.includes(getVideoId(url)));
      if (!thumb) return res.status(404).json({ error: 'Thumbnail not found' });

      // Serve the thumbnail URL (you may want to move it to public hosting)
      res.json({ thumbnailUrl: `/thumbnails/${thumb}` });
    });
  });
});

function getVideoId(url) {
  const match = url.match(/video\/(\\d+)/);
  return match ? match[1] : '';
}

app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

app.listen(3001, () => console.log('API running on port 3001'));