export const config = {
  dataDir: process.env.DATA_DIR || './data',
  publicOrigin: process.env.PUBLIC_ORIGIN || 'http://localhost:3000',
  
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    username: process.env.REDDIT_USERNAME!,
    password: process.env.REDDIT_PASSWORD!,
    userAgent: process.env.REDDIT_USER_AGENT || 'CtrlScrollBot/2.0'
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY!
  },
  
  watchlists: [
    {
      subreddit: 'technology',
      keywords: ['AI', 'artificial intelligence', 'machine learning', 'tech', 'startup'],
      maxAgeHours: 24,
      minScore: 10,
      sort: 'hot' as const,
      limit: 100
    },
    {
      subreddit: 'programming',
      keywords: ['javascript', 'python', 'react', 'node', 'typescript', 'web development'],
      maxAgeHours: 48,
      minScore: 5,
      sort: 'hot' as const,
      limit: 100
    },
    {
      subreddit: 'webdev',
      keywords: ['frontend', 'backend', 'fullstack', 'react', 'vue', 'angular', 'css', 'html'],
      maxAgeHours: 72,
      minScore: 3,
      sort: 'hot' as const,
      limit: 100
    }
  ],
  
  basicAuth: {
    user: process.env.BASIC_AUTH_USER || 'admin',
    pass: process.env.BASIC_AUTH_PASS || 'password'
  }
};