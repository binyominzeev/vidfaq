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
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZGRyZmp6dWppa2ZlaGlkemt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTQwOTAsImV4cCI6MjA3MDQzMDA5MH0.ZYScbz1fXKOD2T194TO0EXnR0UOpsTTuj7HpLHX67v4";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// API to list and download non-English subtitles from TikTok video
app.post('/api/download-subs', async (req, res) => {
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ error: 'Missing video slug' });
  // Fetch video from Supabase by slug
  let url = null, id = null;
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('id, tiktok_url')
      .eq('video_slug', slug)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Video not found for slug', details: error });
    }
    url = data.tiktok_url;
    id = data.id;
  } catch (e) {
    return res.status(500).json({ error: 'Supabase error', details: e });
  }

  // List available subtitles
  const listCmd = `yt-dlp --skip-download --list-subs "${url}"`;
    console.log('[DEBUG] yt-dlp listCmd:', listCmd);
  exec(listCmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: 'yt-dlp failed', details: stderr });
    // Parse output for available subtitles
    // Example output:
    // Language Formats
    // eng-US   vtt
    // hun-HU   vtt
    // Parse yt-dlp output for available subtitles
    const lines = stdout.split('\n');
    const subs = [];
    let parsing = false;
    for (const line of lines) {
      if (line.startsWith('Language Formats')) {
        parsing = true;
        continue;
      }
      if (parsing && line.trim() && !line.startsWith('[')) {
        const [lang, formats] = line.trim().split(/\s+/);
        if (lang && formats) subs.push({ lang, formats });
      }
    }
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
      console.log('[DEBUG] yt-dlp downloadCmd:', downloadCmd);
    exec(downloadCmd, (err2, stdout2, stderr2) => {
      if (err2) return res.status(500).json({ error: 'yt-dlp subtitle download failed', details: stderr2 });
      // Find the subtitle file
      fs.readdir(outputDir, (err3, files) => {
        if (err3) {
          console.error('[DEBUG] Failed to read subtitles directory:', outputDir, err3);
          return res.status(500).json({ error: 'Failed to read subtitles', debug: { outputDir, err3 } });
        }
        console.log('[DEBUG] Files in subtitle outputDir:', files);
        // Use TikTok video ID for file matching
        // Extract TikTok video ID from the URL
        const tiktokIdMatch = url.match(/video\/(\d+)/);
        const tiktokId = tiktokIdMatch ? tiktokIdMatch[1] : null;
        const subFile = files.find(f => tiktokId && f.startsWith(tiktokId + '.') && f.endsWith('.vtt'));
        if (!subFile) {
          console.error('[DEBUG] Subtitle not found after download:', { id, files, outputDir, downloadCmd });
          return res.status(404).json({ error: 'Subtitle not found after download', debug: { id, files, outputDir, downloadCmd } });
        }
        // Read subtitle file content
        const subPath = path.join(outputDir, subFile);
        let transcription = '';
        try {
          transcription = fs.readFileSync(subPath, 'utf8');
        } catch (e) {
          console.error('[DEBUG] Failed to read subtitle file:', subPath, e);
          return res.status(500).json({ error: 'Failed to read subtitle file', debug: { subPath, e } });
        }
        // Save to Supabase videos.transcription
        supabase
        // Log the Supabase update query parameters
        console.log('[DEBUG] Supabase update query:', {
          table: 'videos',
          update: { transcription },
          where: { id }
        });
        supabase
          .from('videos')
          .update({ transcription })
          .eq('id', id)
          .then(({ data: updateData, error: dbError, status, statusText }) => {
            console.log('[DEBUG] Supabase update response:', { updateData, dbError, status, statusText });
            if (dbError) {
              console.error('[DEBUG] Failed to save transcription to Supabase:', dbError);
              return res.status(500).json({ error: 'Failed to save transcription to Supabase', details: dbError, updateData, status, statusText });
            }
            res.json({ available: subs, downloaded: true, subtitleUrl: `/subtitles/${subFile}`, filename: subFile, command: downloadCmd, savedToSupabase: true, updateData, status, statusText });
          })
          .catch(e => {
            console.error('[DEBUG] Supabase update error:', e);
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
    console.log('[DEBUG] yt-dlp thumbnailCmd:', ytDlpCmd);
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