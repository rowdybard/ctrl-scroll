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

3. **Get Reddit API credentials:**
   - Go to https://www.reddit.com/prefs/apps
   - Click "create another app..." at the bottom
   - Fill in:
     - **name**: CtrlScrollBot (or whatever you want)
     - **type**: Select "script"
     - **description**: Reddit content aggregator
     - **about url**: (leave blank)
     - **redirect uri**: http://localhost:8080 (required but not used)
   - Click "create app"
   - Copy the **client ID** (under the app name) and **secret**

4. **Add your API keys** to `.env`:
   ```
   OPENAI_API_KEY=sk-proj-...
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_secret_here
   ```

5. **Generate content:**
   ```bash
   pnpm generate
   ```

6. **Start server:**
   ```bash
   pnpm dev
   ```

7. **Visit:** `http://localhost:3000`

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
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `REDDIT_CLIENT_ID` - From Reddit app
   - `REDDIT_CLIENT_SECRET` - From Reddit app
   - `CRON_SECRET` - Random secret for the /generate endpoint

6. **Deploy!** Your site will be live at `https://ctrlscroll.onrender.com`

## 🛠 Configuration

All settings are in `.env`:

- `OPENAI_API_KEY` - Your OpenAI API key
- `REDDIT_CLIENT_ID` - Reddit app client ID (get from https://www.reddit.com/prefs/apps)
- `REDDIT_CLIENT_SECRET` - Reddit app secret
- `REDDIT_USERNAME` - Your Reddit username or bot name (default: CtrlScrollBot)
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

- ✅ Uses official Reddit OAuth API (no more 403 errors!)
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
- Uses official Reddit OAuth API
- Respects Reddit API ToS
- Includes source attribution
- No personal, medical, or financial advice

## 📝 License

MIT

