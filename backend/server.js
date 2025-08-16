import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://puddrfjzujikfehidzky.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// API to list and download non-English subtitles from TikTok video
app.post('/api/download-subs', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing video id' });
  const url = `https://www.tiktok.com/@_/video/${id}`;

  // List available subtitles
  const listCmd = `yt-dlp --skip-download --list-subs "${url}"`;
  exec(listCmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: 'yt-dlp failed', details: stderr });
    // Parse output for available subtitles
    // Example output:
    // Language Formats
    // eng-US   vtt
    // hun-HU   vtt
    const lines = stdout.split('\n').filter(l => l.trim() && !l.startsWith('Language'));
    const subs = lines.map(line => {
      const [lang, formats] = line.trim().split(/\s+/);
      return { lang, formats };
    });
    // Find non-English subtitle (anything not eng-US)
    const nonEnglish = subs.find(s => s.lang && !s.lang.startsWith('eng'));
    if (!nonEnglish) {
      return res.json({ available: subs, downloaded: false, message: 'No non-English subtitles found.' });
    }
    // Download non-English subtitle
    const subLang = nonEnglish.lang;
    const outputDir = path.join(__dirname, '../subtitles');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const downloadCmd = `yt-dlp --write-subs --sub-langs ${subLang} --skip-download --output "${outputDir}/%(id)s.%(ext)s" "${url}"`;
    exec(downloadCmd, (err2, stdout2, stderr2) => {
      if (err2) return res.status(500).json({ error: 'yt-dlp subtitle download failed', details: stderr2 });
      // Find the subtitle file
      fs.readdir(outputDir, (err3, files) => {
        if (err3) return res.status(500).json({ error: 'Failed to read subtitles' });
        const subFile = files.find(f => f.startsWith(id + '.') && f.endsWith('.vtt'));
        if (!subFile) return res.status(404).json({ error: 'Subtitle not found after download' });
        // Read subtitle file content
        const subPath = path.join(outputDir, subFile);
        let transcription = '';
        try {
          transcription = fs.readFileSync(subPath, 'utf8');
        } catch (e) {
          return res.status(500).json({ error: 'Failed to read subtitle file' });
        }
        // Save to Supabase videos.transcription
        supabase
          .from('videos')
          .update({ transcription })
          .eq('id', id)
          .then(({ error: dbError }) => {
            if (dbError) {
              return res.status(500).json({ error: 'Failed to save transcription to Supabase', details: dbError });
            }
            res.json({ available: subs, downloaded: true, subtitleUrl: `/subtitles/${subFile}`, filename: subFile, command: downloadCmd, savedToSupabase: true });
          })
          .catch(e => {
            return res.status(500).json({ error: 'Supabase update error', details: e });
          });
      });
    });
  });
});

app.use('/subtitles', express.static(path.join(__dirname, '../subtitles')));

app.post('/api/fetch-thumbnail', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  // Use a unique filename based on video ID or timestamp
  const outputDir = path.join(__dirname, '../thumbnails');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // Extract video ID
  function getVideoId(url) {
    const match = url.match(/video\/(\d+)/);
    return match ? match[1] : '';
  }
  const videoId = getVideoId(url);

  // yt-dlp will save thumbnail as [video-id].[ext]
  const ytDlpCmd = `yt-dlp --skip-download --write-thumbnail --output "${outputDir}/%(id)s.%(ext)s" "${url}"`;
  //console.log('Executing:', ytDlpCmd);
  exec(ytDlpCmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: 'yt-dlp failed', details: stderr });

    // Find the thumbnail file in outputDir matching videoId
    fs.readdir(outputDir, (err, files) => {
      if (err) return res.status(500).json({ error: 'Failed to read thumbnails' });
      const thumb = files.find(f => f.startsWith(videoId + '.'));
      if (!thumb) return res.status(404).json({ error: 'Thumbnail not found' });
      //console.log('Sending thumbnail:', thumb);
      // Serve the thumbnail URL (you may want to move it to public hosting)
      res.json({ thumbnailUrl: `/thumbnails/${thumb}`, filename: thumb, command: ytDlpCmd });
    });
  });
});

app.use('/thumbnails', express.static(path.join(__dirname, '../thumbnails')));

app.listen(3001, () => console.log('API running on port 3001'));