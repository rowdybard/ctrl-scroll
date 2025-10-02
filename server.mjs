#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import generate from './run.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const SITE_DIR = process.env.SITE_DIR || './site';
const CRON_SECRET = process.env.CRON_SECRET || 'changeme';
const AUTO_GENERATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

// Serve static files
app.use(express.static(SITE_DIR));

// Protected generate endpoint
app.get('/generate', async (req, res) => {
  const cronHeader = req.headers['x-cron'];
  
  if (cronHeader !== CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid x-cron header' });
  }
  
  try {
    console.log('🔄 Manual generation triggered via /generate endpoint');
    await generate();
    res.json({ success: true, message: 'Site regenerated successfully' });
  } catch (error) {
    console.error('❌ Generation failed:', error);
    res.status(500).json({ error: 'Generation failed', message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index for root
app.get('/', (req, res) => {
  res.sendFile(path.join(SITE_DIR, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('<h1>No content yet</h1><p>Trigger generation at /generate with x-cron header</p>');
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Ctrl Scroll server running on port ${PORT}`);
  console.log(`📂 Serving from: ${SITE_DIR}`);
  console.log(`🔐 Protected endpoint: /generate (requires x-cron: ${CRON_SECRET})`);
  
  // Optional: Auto-generate every 6 hours
  if (process.env.AUTO_GENERATE === 'true') {
    console.log(`⏰ Auto-generation enabled (every 6 hours)`);
    setInterval(async () => {
      try {
        console.log('⏰ Auto-generation triggered');
        await generate();
      } catch (error) {
        console.error('❌ Auto-generation failed:', error);
      }
    }, AUTO_GENERATE_INTERVAL);
    
    // Run once on startup
    setTimeout(async () => {
      try {
        console.log('🚀 Initial generation on startup');
        await generate();
      } catch (error) {
        console.error('❌ Initial generation failed:', error);
      }
    }, 5000);
  }
});

