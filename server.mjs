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

// Admin control panel
app.get('/admin', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ctrl Scroll Admin</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 600px;
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      color: #667eea;
      font-size: 32px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .section {
      background: #f8f9ff;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      border: 2px solid #e0e7ff;
    }
    .section h2 {
      color: #667eea;
      font-size: 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .input-group {
      margin-bottom: 16px;
    }
    .input-group label {
      display: block;
      color: #555;
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .input-group input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e7ff;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s;
      font-family: 'Courier New', monospace;
    }
    .input-group input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .btn {
      width: 100%;
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    .btn-primary:active {
      transform: translateY(0);
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .status {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 16px;
      display: none;
    }
    .status.success {
      background: #d1fae5;
      color: #065f46;
      border: 2px solid #6ee7b7;
      display: block;
    }
    .status.error {
      background: #fee2e2;
      color: #991b1b;
      border: 2px solid #fca5a5;
      display: block;
    }
    .status.loading {
      background: #dbeafe;
      color: #1e40af;
      border: 2px solid #93c5fd;
      display: block;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .stat-card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #e0e7ff;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .quick-actions {
      display: grid;
      gap: 12px;
    }
    .quick-btn {
      padding: 12px 20px;
      background: white;
      border: 2px solid #e0e7ff;
      border-radius: 8px;
      color: #667eea;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .quick-btn:hover {
      background: #f8f9ff;
      border-color: #667eea;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📜 Ctrl Scroll Admin</h1>
      <p>Generate and manage your content</p>
    </div>

    <div class="section">
      <h2>🚀 Generate Content</h2>
      <div class="input-group">
        <label for="cronSecret">Cron Secret</label>
        <input type="password" id="cronSecret" value="${CRON_SECRET}" placeholder="Enter your cron secret">
      </div>
      <button class="btn btn-primary" onclick="generate()">
        Generate New Content
      </button>
      <div id="status" class="status"></div>
    </div>

    <div class="section">
      <h2>📊 Quick Stats</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value" id="postCount">--</div>
          <div class="stat-label">Total Posts</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="lastGen">--</div>
          <div class="stat-label">Last Generated</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>⚡ Quick Actions</h2>
      <div class="quick-actions">
        <button class="quick-btn" onclick="window.open('/', '_blank')">View Site →</button>
        <button class="quick-btn" onclick="window.open('/sitemap.xml', '_blank')">View Sitemap →</button>
        <button class="quick-btn" onclick="checkHealth()">Health Check</button>
      </div>
    </div>
  </div>

  <script>
    async function generate() {
      const secret = document.getElementById('cronSecret').value;
      const statusEl = document.getElementById('status');
      const btn = event.target;

      if (!secret) {
        statusEl.className = 'status error';
        statusEl.textContent = '⚠️ Please enter your cron secret';
        return;
      }

      btn.disabled = true;
      statusEl.className = 'status loading';
      statusEl.textContent = '⏳ Generating content... This may take a minute.';

      try {
        const response = await fetch('/generate', {
          headers: { 'x-cron': secret }
        });
        const data = await response.json();

        if (response.ok) {
          statusEl.className = 'status success';
          statusEl.textContent = '✅ ' + (data.message || 'Content generated successfully!');
          updateStats();
        } else {
          statusEl.className = 'status error';
          statusEl.textContent = '❌ ' + (data.error || 'Generation failed');
        }
      } catch (error) {
        statusEl.className = 'status error';
        statusEl.textContent = '❌ Error: ' + error.message;
      } finally {
        btn.disabled = false;
      }
    }

    async function checkHealth() {
      try {
        const response = await fetch('/health');
        const data = await response.json();
        alert('✅ System Status: ' + data.status.toUpperCase() + '\\nTimestamp: ' + data.timestamp);
      } catch (error) {
        alert('❌ Health check failed: ' + error.message);
      }
    }

    async function updateStats() {
      try {
        const response = await fetch('/');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const postCards = doc.querySelectorAll('.post-card');
        document.getElementById('postCount').textContent = postCards.length;
        document.getElementById('lastGen').textContent = 'Now';
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }

    // Load stats on page load
    updateStats();
  </script>
</body>
</html>`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index for root
app.get('/', (req, res) => {
  res.sendFile(path.resolve(SITE_DIR, 'index.html'), (err) => {
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

