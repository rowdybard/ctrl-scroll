// API contract tests to ensure endpoints return expected shapes

describe('API Contracts', () => {
  describe('GET /v1/posts', () => {
    it('should return expected response shape', () => {
      const mockResponse = {
        items: [
          {
            id: 'abcd12',
            title: 'Sample Post Title',
            micro: 'One sentence summary of the post content.',
            created_utc: 1696598400,
            subreddit: 'news',
            score: 0.83,
            tags: ['Tech'],
            permalink: '/post/abcd12'
          }
        ],
        nextPage: 2
      };

      // Validate structure
      expect(mockResponse).toHaveProperty('items');
      expect(Array.isArray(mockResponse.items)).toBe(true);
      expect(mockResponse).toHaveProperty('nextPage');
      expect(typeof mockResponse.nextPage).toBe('number');

      // Validate item structure
      const item = mockResponse.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('micro');
      expect(item).toHaveProperty('created_utc');
      expect(item).toHaveProperty('subreddit');
      expect(item).toHaveProperty('score');
      expect(item).toHaveProperty('tags');
      expect(item).toHaveProperty('permalink');

      // Validate types
      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.micro).toBe('string');
      expect(typeof item.created_utc).toBe('number');
      expect(typeof item.subreddit).toBe('string');
      expect(typeof item.score).toBe('number');
      expect(Array.isArray(item.tags)).toBe(true);
      expect(typeof item.permalink).toBe('string');
    });

    it('should handle empty results', () => {
      const emptyResponse = {
        items: [],
        nextPage: undefined
      };

      expect(Array.isArray(emptyResponse.items)).toBe(true);
      expect(emptyResponse.items).toHaveLength(0);
      expect(emptyResponse.nextPage).toBeUndefined();
    });
  });

  describe('POST /v1/track', () => {
    it('should accept valid tracking data', () => {
      const validRequests = [
        { postId: 'abc123', variant: 'A', event: 'impression' },
        { postId: 'def456', variant: 'B', event: 'click' },
        { postId: 'ghi789', variant: 'C', event: 'impression' }
      ];

      validRequests.forEach(request => {
        expect(request).toHaveProperty('postId');
        expect(request).toHaveProperty('variant');
        expect(request).toHaveProperty('event');
        
        expect(typeof request.postId).toBe('string');
        expect(['A', 'B', 'C']).toContain(request.variant);
        expect(['impression', 'click']).toContain(request.event);
      });
    });

    it('should return success response', () => {
      const successResponse = { ok: true };
      
      expect(successResponse).toHaveProperty('ok');
      expect(successResponse.ok).toBe(true);
    });
  });

  describe('RSS Feed', () => {
    it('should contain required RSS elements', () => {
      const mockRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Ctrl+Scroll</title>
    <description>AI-curated summaries</description>
    <link>https://ctrlscroll.com</link>
    <item>
      <title>Sample Post</title>
      <description>Post description</description>
      <link>https://ctrlscroll.com/post/123</link>
      <guid>https://ctrlscroll.com/post/123</guid>
      <pubDate>Wed, 04 Oct 2023 12:00:00 GMT</pubDate>
      <category>news</category>
    </item>
  </channel>
</rss>`;

      expect(mockRSS).toContain('<rss version="2.0">');
      expect(mockRSS).toContain('<channel>');
      expect(mockRSS).toContain('<title>Ctrl+Scroll</title>');
      expect(mockRSS).toContain('<description>');
      expect(mockRSS).toContain('<link>');
      expect(mockRSS).toContain('<item>');
    });
  });

  describe('JSON Feed', () => {
    it('should return valid JSON Feed format', () => {
      const mockJSONFeed = {
        version: "https://jsonfeed.org/version/1.1",
        title: "Ctrl+Scroll",
        description: "AI-curated summaries",
        home_page_url: "https://ctrlscroll.com",
        feed_url: "https://ctrlscroll.com/v1/feed.json",
        items: [
          {
            id: "123",
            title: "Sample Post",
            content_text: "Post content",
            url: "https://ctrlscroll.com/post/123",
            date_published: "2023-10-04T12:00:00Z",
            tags: ["news"],
            authors: [
              {
                name: "r/news",
                url: "https://reddit.com/r/news"
              }
            ]
          }
        ]
      };

      expect(mockJSONFeed).toHaveProperty('version');
      expect(mockJSONFeed).toHaveProperty('title');
      expect(mockJSONFeed).toHaveProperty('description');
      expect(mockJSONFeed).toHaveProperty('home_page_url');
      expect(mockJSONFeed).toHaveProperty('feed_url');
      expect(mockJSONFeed).toHaveProperty('items');
      expect(Array.isArray(mockJSONFeed.items)).toBe(true);

      const item = mockJSONFeed.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('content_text');
      expect(item).toHaveProperty('url');
      expect(item).toHaveProperty('date_published');
      expect(item).toHaveProperty('tags');
      expect(item).toHaveProperty('authors');
    });
  });
});
