# Ctrl+Scroll V2

A production-grade Reddit content aggregator with AI summarization, built as a single Next.js service for cost-effective deployment on Render.

## 🏗️ Architecture

- **Web Service**: All-in-one Next.js app with:
  - Frontend: React components with A/B testing
  - API Routes: Public REST endpoints for posts, feeds, and metrics  
  - Worker Functions: Reddit ingestion, processing, and disk persistence
  - Background Jobs: Scheduled via Render cron jobs
- **Shared**: Common utilities (atomic writes, simhash, scoring)

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Create environment file:**
   ```bash
   cp env.example .env
   ```

3. **Get Reddit API credentials:**
   - Go to https://www.reddit.com/prefs/apps
   - Create a "script" app
   - Add credentials to `.env`

4. **Start the service:**
   ```bash
   pnpm dev
   ```

5. **Visit:** http://localhost:3000

## 📦 Deploy to Render

1. **Push to GitHub**

2. **Connect repository** to Render

3. **Set environment variables:**
   ```
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_secret
   REDDIT_USERNAME=your_username
   REDDIT_PASSWORD=your_password
   BASIC_AUTH_USER=admin
   BASIC_AUTH_PASS=secure_password
   ```

4. **Deploy!** Render will use `render.yaml` to create:
   - 1× Web service (Next.js with all functionality)
   - 3× Scheduled jobs (ingest, refresh, feeds)
   - 1× Persistent disk for data storage

## 🛠️ Features

- ✅ **Reddit API Integration**: OAuth script app with rate limiting
- ✅ **Disk-Only Persistence**: No database, atomic file operations
- ✅ **AI Summarization**: Preserves 1-sentence summaries, adds bullets & headlines
- ✅ **Content Deduplication**: SimHash-based near-duplicate detection
- ✅ **Scoring Algorithm**: Multi-factor scoring (recency, engagement, controversy)
- ✅ **A/B Testing**: Multiple headline variants with tracking
- ✅ **Feeds & SEO**: RSS, JSON feeds, sitemap generation
- ✅ **Production Ready**: TypeScript, Docker, monitoring

## 📁 Data Layout

```
/data/
├── reddit/token.json              # OAuth token cache
├── raw/YYYY-MM-DD/               # Raw Reddit data
├── derived/posts/                # Processed posts
├── index/posts.jsonl             # Main post index
├── index/by_subreddit/           # Subreddit indexes
├── feeds/rss.xml                 # RSS feed
├── feeds/feed.json               # JSON feed
├── sitemap.xml                   # SEO sitemap
└── metrics/                      # A/B test metrics
```

## 🔧 Configuration

Edit `apps/web/lib/config.ts` to customize:

- **Watchlists**: Subreddits to monitor
- **Rate Limits**: API request throttling
- **Scoring Weights**: Algorithm parameters

## 📊 API Endpoints

- `GET /v1/posts` - Paginated post feed
- `GET /v1/posts/:id` - Individual post
- `POST /v1/track` - A/B test tracking
- `GET /v1/rss.xml` - RSS feed
- `GET /v1/feed.json` - JSON feed
- `GET /sitemap.xml` - SEO sitemap

## 🧪 Testing

```bash
pnpm test          # Run all tests
pnpm test:shared   # Shared utilities only
```

## 📝 License

MIT