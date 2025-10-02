# Ctrl Scroll

> A minimal Reddit → GPT → static site generator for Render

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Create `.env` file** (copy from `env.example`):
   ```bash
   cp env.example .env
   ```

3. **Add your OpenAI API key** to `.env`:
   ```
   OPENAI_API_KEY=sk-proj-...
   ```

4. **Generate content:**
   ```bash
   pnpm generate
   ```

5. **Start server:**
   ```bash
   pnpm dev
   ```

6. **Visit:** `http://localhost:3000`

### Manual Generation

Trigger content generation via protected endpoint:
```bash
curl -H "x-cron: changeme" http://localhost:3000/generate
```

## 📦 Deploy to Render

1. **Push to GitHub**

2. **Create new Web Service** on Render

3. **Connect your repository**

4. **Render will auto-detect** `render.yaml`

5. **Set environment secrets:**
   - `OPENAI_API_KEY`
   - `CRON_SECRET`

6. **Deploy!** Your site will be live at `https://ctrlscroll.onrender.com`

## 🛠 Configuration

All settings are in `.env`:

- `OPENAI_API_KEY` - Your OpenAI API key
- `ALLOWLIST_SUBS` - Comma-separated subreddits (e.g., `news,technology`)
- `DENYLIST` - Comma-separated keywords to filter (e.g., `NSFW,leak`)
- `MAX_POSTS` - Max posts per subreddit (default: 3)
- `MIN_SCORE` - Minimum upvotes required (default: 50)
- `MAX_AGE_HOURS` - Max post age in hours (default: 48)
- `CRON_SECRET` - Secret for `/generate` endpoint
- `SITE_URL` - Your public URL
- `SITE_DIR` - Where to write HTML files (default: `./site`)
- `AUTO_GENERATE` - Set to `true` to auto-regenerate every 6 hours

## 📁 Project Structure

```
ctrl-scroll/
├── run.mjs          # Generator (fetches Reddit, calls GPT, writes HTML)
├── server.mjs       # Express server
├── package.json     # Dependencies & scripts
├── render.yaml      # Render deployment config
├── env.example      # Environment variables template
└── site/            # Generated static files (auto-created)
    ├── index.html
    ├── sitemap.xml
    ├── robots.txt
    └── posts/
        └── *.html
```

## 🎯 Features

- ✅ Fetches hot posts from allowlisted subreddits
- ✅ Filters NSFW, denylist keywords, low scores
- ✅ Summarizes with GPT-4o-mini
- ✅ Generates static HTML pages
- ✅ Auto-generates sitemap & robots.txt
- ✅ Protected `/generate` endpoint
- ✅ Optional auto-regeneration every 6 hours
- ✅ Persistent disk storage on Render
- ✅ Reddit attribution with rel="nofollow ugc"

## 🔒 Guardrails

- Only processes allowlisted subreddits
- Blocks NSFW content
- Filters denylist keywords
- Respects Reddit API ToS
- Sets proper User-Agent
- Includes source attribution
- No personal, medical, or financial advice

## 📝 License

MIT

