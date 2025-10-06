#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import generate from './run.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const SITE_DIR = process.env.SITE_DIR || path.join(process.cwd(), 'site');
const CRON_SECRET = process.env.CRON_SECRET || 'changeme';
const AUTO_GENERATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

// Middleware
app.use(express.json());

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
    const result = await generate();
    res.json({ 
      success: true, 
      message: `Generated ${result.totalPosts} posts successfully`,
      data: result
    });
  } catch (error) {
    console.error('❌ Generation failed:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Generation failed', 
      message: error.message,
      details: error.stack 
    });
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
      max-width: 1400px;
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
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
    .post-manager {
      margin-top: 20px;
    }
    .search-box {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e7ff;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .search-box:focus {
      outline: none;
      border-color: #667eea;
    }
    .post-table-container {
      max-height: 600px;
      overflow-y: auto;
      border: 2px solid #e0e7ff;
      border-radius: 8px;
      background: white;
    }
    .post-table {
      width: 100%;
      background: white;
    }
    .post-table table {
      width: 100%;
      border-collapse: collapse;
    }
    .post-table tbody tr {
      cursor: move;
      user-select: none;
    }
    .post-table tbody tr.dragging {
      opacity: 0.5;
      background: #f8f9ff;
    }
    .post-table tbody tr.drag-over {
      border-top: 3px solid #667eea;
    }
    .post-table th {
      background: #f8f9ff;
      color: #667eea;
      font-weight: 600;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .post-table td {
      padding: 12px;
      border-top: 1px solid #e0e7ff;
      font-size: 14px;
    }
    .post-table tr:hover {
      background: #f8f9ff;
    }
    .post-title {
      font-weight: 600;
      color: #333;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .post-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-news { background: #dbeafe; color: #1e40af; }
    .badge-worldnews { background: #fef3c7; color: #92400e; }
    .badge-technology { background: #ddd6fe; color: #5b21b6; }
    .badge-science { background: #d1fae5; color: #065f46; }
    .badge-askreddit { background: #fce7f3; color: #9f1239; }
    .post-actions {
      display: flex;
      gap: 8px;
    }
    .btn-small {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-view {
      background: #667eea;
      color: white;
    }
    .btn-view:hover {
      background: #5568d3;
    }
    .btn-preview {
      background: #8b5cf6;
      color: white;
    }
    .btn-preview:hover {
      background: #7c3aed;
    }
    .btn-delete {
      background: #ef4444;
      color: white;
    }
    .btn-delete:hover {
      background: #dc2626;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
      padding: 20px;
      overflow-y: auto;
    }
    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }
    .modal-header {
      padding: 24px;
      border-bottom: 2px solid #e0e7ff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    }
    .modal-header h3 {
      color: #667eea;
      margin: 0;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    .modal-close:hover {
      background: #f8f9ff;
      color: #333;
    }
    .modal-body {
      padding: 24px;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #667eea;
    }
    .post-manager-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .post-manager-header h2 {
      margin: 0;
    }
    .btn-danger {
      background: #ef4444;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-danger:hover {
      background: #dc2626;
      transform: translateY(-1px);
    }
    .drag-handle {
      cursor: move;
      color: #999;
      margin-right: 8px;
    }
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 16px 24px;
      z-index: 2000;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      animation: slideIn 0.3s ease;
      border-left: 4px solid #667eea;
    }
    .toast.success { border-left-color: #10b981; }
    .toast.error { border-left-color: #ef4444; }
    .toast.warning { border-left-color: #f59e0b; }
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast-icon {
      font-size: 24px;
    }
    .toast-content {
      flex: 1;
    }
    .toast-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .toast-message {
      font-size: 13px;
      color: #666;
    }
    .confirm-modal .modal-content {
      max-width: 500px;
    }
    .confirm-body {
      padding: 24px;
      text-align: center;
    }
    .confirm-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .confirm-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }
    .confirm-message {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .confirm-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e7ff;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .confirm-input:focus {
      outline: none;
      border-color: #667eea;
    }
    .confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .confirm-btn {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .confirm-btn-cancel {
      background: #e5e7eb;
      color: #333;
    }
    .confirm-btn-cancel:hover {
      background: #d1d5db;
    }
    .confirm-btn-confirm {
      background: #ef4444;
      color: white;
    }
    .confirm-btn-confirm:hover {
      background: #dc2626;
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
        <div class="stat-card">
          <div class="stat-value" id="usedPostCount">--</div>
          <div class="stat-label">Unique Stories Used</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="duplicatesPrevented">--</div>
          <div class="stat-label">Duplicates Prevented</div>
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

    <div class="section">
      <div class="post-manager-header">
        <h2>📝 Post Manager</h2>
        <button class="btn-danger" onclick="deleteAllPosts()">🗑️ Delete All Posts</button>
      </div>
      <input type="text" id="searchPosts" class="search-box" placeholder="🔍 Search posts by title, subreddit, or content...">
      
      <div id="postsContainer">
        <div class="loading">
          <div>⏳ Loading posts...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Preview Modal -->
  <div id="previewModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>📄 Post Preview</h3>
        <button class="modal-close" onclick="closeModal('previewModal')">×</button>
      </div>
      <div class="modal-body" id="modalBody">
        <div class="loading">Loading...</div>
      </div>
    </div>
  </div>

  <!-- Confirm Modal -->
  <div id="confirmModal" class="modal confirm-modal">
    <div class="modal-content">
      <div class="confirm-body">
        <div class="confirm-icon" id="confirmIcon">⚠️</div>
        <div class="confirm-title" id="confirmTitle">Confirm Action</div>
        <div class="confirm-message" id="confirmMessage">Are you sure?</div>
        <input type="text" id="confirmInput" class="confirm-input" style="display: none;" placeholder="Type here...">
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn-cancel" onclick="closeModal('confirmModal')">Cancel</button>
          <button class="confirm-btn confirm-btn-confirm" id="confirmButton">Confirm</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function generate() {
      const secret = document.getElementById('cronSecret').value;
      const btn = event.target;

      if (!secret) {
        showToast('Cron Secret Required', 'Please enter your cron secret', 'warning');
        return;
      }

      btn.disabled = true;
      btn.textContent = '⏳ Generating...';
      showToast('Generating...', 'This may take a minute', 'warning');

      try {
        const response = await fetch('/generate', {
          headers: { 'x-cron': secret }
        });
        const data = await response.json();

        if (response.ok) {
          showToast('Success!', 'Generated ' + (data.data?.totalPosts || 0) + ' posts', 'success');
          updateStats();
          loadPosts(); // Reload post manager
        } else {
          showToast('Generation Failed', data.error || 'Unknown error', 'error');
        }
      } catch (error) {
        showToast('Error', error.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate New Content';
      }
    }

    async function checkHealth() {
      try {
        const response = await fetch('/health');
        const data = await response.json();
        showToast('System Healthy', 'Status: ' + data.status.toUpperCase(), 'success');
      } catch (error) {
        showToast('Health Check Failed', error.message, 'error');
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
        
        // Load used posts stats
        try {
          const usedResponse = await fetch('/api/used-posts-stats');
          const usedData = await usedResponse.json();
          if (usedResponse.ok) {
            document.getElementById('usedPostCount').textContent = usedData.totalUsed || 0;
            document.getElementById('duplicatesPrevented').textContent = usedData.duplicatesPrevented || 0;
          }
        } catch (e) {
          console.error('Failed to load used posts stats:', e);
        }
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }

    // Load stats on page load
    updateStats();

    // ===== POST MANAGER =====
    let allPosts = [];

    async function loadPosts() {
      try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        allPosts = data.posts || [];
        displayPosts(allPosts);
        document.getElementById('postCount').textContent = allPosts.length;
      } catch (error) {
        console.error('Failed to load posts:', error);
        document.getElementById('postsContainer').innerHTML = 
          '<div class="empty-state"><div class="empty-state-icon">❌</div><div>Failed to load posts</div></div>';
      }
    }

    function displayPosts(posts) {
      const container = document.getElementById('postsContainer');
      
      if (posts.length === 0) {
        container.innerHTML = 
          '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No posts found</div><small>Generate content to see posts here</small></div>';
        return;
      }

      const html = \`
        <div class="post-table-container">
          <div class="post-table">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;"></th>
                  <th>Title</th>
                  <th>Subreddit</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="postTableBody">
                \${posts.map((post, index) => \`
                  <tr draggable="true" data-slug="\${post.slug}" data-index="\${index}">
                    <td>
                      <span class="drag-handle">⋮⋮</span>
                    </td>
                    <td>
                      <div class="post-title" title="\${escapeHtml(post.title)}">
                        \${escapeHtml(post.title)}
                      </div>
                    </td>
                    <td>
                      <span class="post-badge badge-\${post.subreddit.toLowerCase()}">
                        r/\${escapeHtml(post.subreddit)}
                      </span>
                    </td>
                    <td>\${post.score} ↑</td>
                    <td>\${post.date}</td>
                    <td>
                      <div class="post-actions">
                        <button class="btn-small btn-view" onclick="window.open('/posts/\${post.slug}.html', '_blank')" title="View Live">
                          👁️ View
                        </button>
                        <button class="btn-small btn-preview" onclick="previewPost('\${post.slug}')" title="Preview Formatted">
                          🔍 Preview
                        </button>
                        <button class="btn-small btn-delete" onclick="deletePost('\${post.slug}')" title="Delete Post">
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \`;
      
      container.innerHTML = html;
      
      // Setup drag and drop
      setupDragAndDrop();
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Search functionality
    document.getElementById('searchPosts')?.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      if (!query) {
        displayPosts(allPosts);
        return;
      }

      const filtered = allPosts.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.subreddit.toLowerCase().includes(query) ||
        post.summaryPreview.toLowerCase().includes(query)
      );
      
      displayPosts(filtered);
    });

    // Toast notifications
    function showToast(title, message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = \`toast \${type}\`;
      
      const icons = { success: '✅', error: '❌', warning: '⚠️' };
      
      toast.innerHTML = \`
        <div class="toast-icon">\${icons[type] || '📢'}</div>
        <div class="toast-content">
          <div class="toast-title">\${title}</div>
          <div class="toast-message">\${message}</div>
        </div>
      \`;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }

    // Modal helpers
    function closeModal(modalId) {
      const modal = document.getElementById(modalId);
      modal.classList.remove('active');
    }

    // Close modal on background click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
      }
    });

    // Preview post
    async function previewPost(slug) {
      const modal = document.getElementById('previewModal');
      const modalBody = document.getElementById('modalBody');
      
      modal.classList.add('active');
      modalBody.innerHTML = '<div class="loading">⏳ Loading preview...</div>';
      
      try {
        const response = await fetch(\`/api/posts/\${slug}\`);
        const data = await response.json();
        
        if (response.ok) {
          modalBody.innerHTML = data.content;
        } else {
          modalBody.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div>Failed to load preview</div></div>';
          showToast('Preview Failed', 'Could not load post', 'error');
        }
      } catch (error) {
        console.error('Preview error:', error);
        modalBody.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div>Error loading preview</div></div>';
        showToast('Error', error.message, 'error');
      }
    }

    // Confirm dialog
    function showConfirm(title, message, onConfirm, options = {}) {
      const modal = document.getElementById('confirmModal');
      const icon = document.getElementById('confirmIcon');
      const titleEl = document.getElementById('confirmTitle');
      const messageEl = document.getElementById('confirmMessage');
      const input = document.getElementById('confirmInput');
      const button = document.getElementById('confirmButton');
      
      icon.textContent = options.icon || '⚠️';
      titleEl.textContent = title;
      messageEl.textContent = message;
      
      if (options.requireInput) {
        input.style.display = 'block';
        input.value = '';
        input.placeholder = options.placeholder || 'Type here...';
      } else {
        input.style.display = 'none';
      }
      
      button.onclick = () => {
        if (options.requireInput) {
          const value = input.value.trim();
          if (value !== options.requiredValue) {
            showToast('Invalid Input', \`Please type "\${options.requiredValue}" to confirm\`, 'error');
            return;
          }
        }
        closeModal('confirmModal');
        onConfirm();
      };
      
      modal.classList.add('active');
      if (options.requireInput) {
        setTimeout(() => input.focus(), 100);
      }
    }

    // Delete post
    async function deletePost(slug) {
      const post = allPosts.find(p => p.slug === slug);
      if (!post) return;

      const secret = document.getElementById('cronSecret').value;
      if (!secret) {
        showToast('Cron Secret Required', 'Please enter your cron secret first', 'warning');
        return;
      }

      showConfirm(
        'Delete Post',
        \`Are you sure you want to delete "\${post.title}"? This action cannot be undone.\`,
        async () => {
          try {
            const response = await fetch(\`/api/posts/\${slug}\`, {
              method: 'DELETE',
              headers: { 'x-cron': secret }
            });

            const data = await response.json();

            if (response.ok) {
              showToast('Post Deleted', 'Successfully removed post', 'success');
              loadPosts();
              updateStats();
            } else {
              showToast('Delete Failed', data.error || 'Unknown error', 'error');
            }
          } catch (error) {
            showToast('Error', error.message, 'error');
          }
        },
        { icon: '🗑️' }
      );
    }

    // Drag and drop functionality
    let draggedElement = null;

    function setupDragAndDrop() {
      const tbody = document.getElementById('postTableBody');
      if (!tbody) return;

      const rows = tbody.querySelectorAll('tr[draggable="true"]');
      
      rows.forEach(row => {
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
        row.addEventListener('dragenter', handleDragEnter);
        row.addEventListener('dragleave', handleDragLeave);
      });
    }

    function handleDragStart(e) {
      draggedElement = this;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    }

    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'move';
      return false;
    }

    function handleDragEnter(e) {
      if (this !== draggedElement) {
        this.classList.add('drag-over');
      }
    }

    function handleDragLeave(e) {
      this.classList.remove('drag-over');
    }

    function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }

      if (draggedElement !== this) {
        // Swap the dragged element with the drop target
        const allRows = Array.from(this.parentNode.children);
        const draggedIndex = allRows.indexOf(draggedElement);
        const targetIndex = allRows.indexOf(this);

        if (draggedIndex < targetIndex) {
          this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
          this.parentNode.insertBefore(draggedElement, this);
        }

        // Update the order in allPosts array
        const draggedPost = allPosts[draggedIndex];
        allPosts.splice(draggedIndex, 1);
        const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        allPosts.splice(newTargetIndex, 0, draggedPost);
      }

      return false;
    }

    function handleDragEnd(e) {
      this.classList.remove('dragging');
      
      // Remove drag-over class from all rows
      const rows = document.querySelectorAll('#postTableBody tr');
      rows.forEach(row => row.classList.remove('drag-over'));
    }

    // Delete all posts
    async function deleteAllPosts() {
      if (allPosts.length === 0) {
        showToast('No Posts', 'There are no posts to delete', 'warning');
        return;
      }

      const secret = document.getElementById('cronSecret').value;
      if (!secret) {
        showToast('Cron Secret Required', 'Please enter your cron secret first', 'warning');
        return;
      }

      showConfirm(
        'Delete All Posts',
        \`This will permanently delete ALL \${allPosts.length} posts. This action CANNOT be undone.\`,
        async () => {
          let deleted = 0;
          let failed = 0;

          showToast('Deleting...', \`Removing \${allPosts.length} posts\`, 'warning');

          for (const post of allPosts) {
            try {
              const response = await fetch(\`/api/posts/\${post.slug}\`, {
                method: 'DELETE',
                headers: { 'x-cron': secret }
              });

              if (response.ok) {
                deleted++;
              } else {
                failed++;
              }
            } catch (error) {
              console.error(\`Failed to delete \${post.slug}:\`, error);
              failed++;
            }
          }

          showToast(
            'Batch Delete Complete', 
            \`Deleted: \${deleted}\` + (failed > 0 ? \` | Failed: \${failed}\` : ''), 
            failed > 0 ? 'warning' : 'success'
          );
          loadPosts();
          updateStats();
        },
        { 
          icon: '🗑️',
          requireInput: true,
          requiredValue: 'DELETE ALL',
          placeholder: 'Type "DELETE ALL" to confirm'
        }
      );
    }

    // Load posts on page load
    loadPosts();
  </script>
</body>
</html>`);
});

// API: List all posts with metadata
app.get('/api/posts', async (req, res) => {
  try {
    const postsDir = path.join(SITE_DIR, 'posts');
    const metadataPath = path.join(SITE_DIR, 'metadata.json');
    
    // Check if posts directory exists
    if (!await fs.pathExists(postsDir)) {
      return res.json({ posts: [], total: 0 });
    }
    
    // Read metadata if exists
    let metadata = {};
    if (await fs.pathExists(metadataPath)) {
      metadata = await fs.readJson(metadataPath);
    }
    
    // Get all HTML files
    const files = await fs.readdir(postsDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    // Build post list with metadata
    const posts = htmlFiles.map(file => {
      const slug = file.replace('.html', '');
      const meta = metadata[slug] || {};
      return {
        slug,
        title: meta.title || slug,
        subreddit: meta.subreddit || 'unknown',
        score: meta.score || 0,
        date: meta.date || 'Unknown',
        created: meta.created || 0,
        url: meta.url || '',
        summaryPreview: meta.summary ? meta.summary.substring(0, 100) + '...' : ''
      };
    });
    
    // Sort by creation time (newest first)
    posts.sort((a, b) => b.created - a.created);
    
    res.json({ posts, total: posts.length });
  } catch (error) {
    console.error('Error listing posts:', error);
    res.status(500).json({ error: 'Failed to list posts', message: error.message });
  }
});

// API: Get individual post content
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const postPath = path.join(SITE_DIR, 'posts', `${slug}.html`);
    const metadataPath = path.join(SITE_DIR, 'metadata.json');
    
    if (!await fs.pathExists(postPath)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const content = await fs.readFile(postPath, 'utf-8');
    
    // Get metadata
    let metadata = {};
    if (await fs.pathExists(metadataPath)) {
      const allMeta = await fs.readJson(metadataPath);
      metadata = allMeta[slug] || {};
    }
    
    res.json({
      slug,
      content,
      metadata
    });
  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ error: 'Failed to get post', message: error.message });
  }
});

// API: Get used posts stats
app.get('/api/used-posts-stats', async (req, res) => {
  try {
    const usedPostsPath = path.join(SITE_DIR, 'used_posts.json');
    
    if (!await fs.pathExists(usedPostsPath)) {
      return res.json({ totalUsed: 0, duplicatesPrevented: 0, lastUpdated: null });
    }
    
    const data = await fs.readJson(usedPostsPath);
    
    res.json({
      totalUsed: data.totalUsed || data.ids?.length || 0,
      duplicatesPrevented: data.duplicatesPrevented || 0,
      lastUpdated: data.lastUpdated || null
    });
  } catch (error) {
    console.error('Error reading used posts stats:', error);
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

// API: Delete post
app.delete('/api/posts/:slug', async (req, res) => {
  const cronHeader = req.headers['x-cron'];
  
  if (cronHeader !== CRON_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid x-cron header' });
  }
  
  try {
    const { slug } = req.params;
    const postPath = path.join(SITE_DIR, 'posts', `${slug}.html`);
    const metadataPath = path.join(SITE_DIR, 'metadata.json');
    
    if (!await fs.pathExists(postPath)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Delete the post file
    await fs.remove(postPath);
    
    // Remove from metadata
    let allPosts = [];
    if (await fs.pathExists(metadataPath)) {
      const metadata = await fs.readJson(metadataPath);
      delete metadata[slug];
      await fs.writeJson(metadataPath, metadata);
      
      // Rebuild allPosts array from remaining metadata
      allPosts = Object.entries(metadata).map(([slug, meta]) => ({
        slug,
        title: meta.title,
        subreddit: meta.subreddit,
        score: meta.score,
        date: meta.date,
        created: meta.created,
        summary: meta.summary
      }));
    }
    
    // Regenerate index.html with remaining posts
    allPosts.sort((a, b) => b.created - a.created);
    const indexTemplate = (posts) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ctrl Scroll - AI-Curated Reddit News</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #333; margin-bottom: 10px; }
    .header p { color: #666; }
    .posts { display: grid; gap: 20px; }
    .post-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s; }
    .post-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
    .post-card h2 { margin-top: 0; }
    .post-card h2 a { color: #333; text-decoration: none; }
    .post-card h2 a:hover { color: #ff4500; }
    .post-meta { color: #666; font-size: 14px; margin-bottom: 10px; }
    .post-summary { color: #555; }
    .footer { text-align: center; margin-top: 60px; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📜 Ctrl Scroll</h1>
    <p>AI-curated summaries from Reddit's top discussions</p>
  </div>
  <div class="posts">
    ${posts.map(p => `
    <div class="post-card">
      <h2><a href="/posts/${p.slug}.html">${p.title.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}</a></h2>
      <div class="post-meta">r/${p.subreddit} • ${p.score} upvotes • ${p.date}</div>
      <div class="post-summary">${(p.summary || '').substring(0, 200).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}...</div>
    </div>
    `).join('')}
  </div>
  <div class="footer">
    Generated by Ctrl Scroll • Content sourced from Reddit
  </div>
</body>
</html>`;
    
    await fs.writeFile(path.join(SITE_DIR, 'index.html'), indexTemplate(allPosts.slice(0, 30)));
    console.log(`🗑️  Deleted post: ${slug} and regenerated index`);
    res.json({ success: true, message: `Post ${slug} deleted` });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post', message: error.message });
  }
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


