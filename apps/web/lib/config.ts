export const config = {
  dataDir: process.env.DATA_DIR || './data',
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    username: process.env.REDDIT_USERNAME || '',
    password: process.env.REDDIT_PASSWORD || '',
    userAgent: process.env.REDDIT_USER_AGENT || 'CtrlScrollBot/2.0 by u/ctrlscroll'
  },
  auth: {
    user: process.env.BASIC_AUTH_USER || 'admin',
    pass: process.env.BASIC_AUTH_PASS || 'change-me'
  },
  publicOrigin: process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
  watchlists: [
    { subreddit: 'news', sort: 'hot' as const, limit: 5 },
    { subreddit: 'worldnews', sort: 'hot' as const, limit: 5 },
    { subreddit: 'technology', sort: 'hot' as const, limit: 3 },
    { subreddit: 'science', sort: 'hot' as const, limit: 3 },
    { subreddit: 'AskReddit', sort: 'hot' as const, limit: 2 }
  ]
};
