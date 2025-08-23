/**
 * News Articles Test Cases
 * Tests for news functionality and content management
 */

describe('News Articles Tests', () => {
  const baseUrl = 'http://localhost:5000';
  let sessionCookie;

  beforeAll(async () => {
    // Login as admin to get session
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cryptowallet.com',
        password: 'password123'
      })
    });
    sessionCookie = loginResponse.headers.get('set-cookie');
  });

  describe('News Retrieval', () => {
    test('Should fetch published news articles', async () => {
      const response = await fetch(`${baseUrl}/api/news`);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const article = data[0];
        expect(article.title).toBeDefined();
        expect(article.description).toBeDefined();
        expect(article.category).toBeDefined();
        expect(article.isPublished).toBe(true);
        expect(article.createdAt).toBeDefined();
      }
    });

    test('Should return only published articles to public', async () => {
      const response = await fetch(`${baseUrl}/api/news`);
      const data = await response.json();
      
      // All returned articles should be published
      data.forEach(article => {
        expect(article.isPublished).toBe(true);
      });
    });

    test('Should sort articles by creation date (newest first)', async () => {
      const response = await fetch(`${baseUrl}/api/news`);
      const data = await response.json();
      
      if (data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const currentDate = new Date(data[i].createdAt);
          const nextDate = new Date(data[i + 1].createdAt);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });
  });

  describe('News Categories', () => {
    test('Should validate news categories', async () => {
      const response = await fetch(`${baseUrl}/api/news`);
      const data = await response.json();
      
      const validCategories = ['announcement', 'update', 'feature', 'partnership', 'general'];
      
      data.forEach(article => {
        expect(validCategories).toContain(article.category);
      });
    });

    test('Should filter news by category if supported', async () => {
      const response = await fetch(`${baseUrl}/api/news?category=announcement`);
      
      if (response.status === 200) {
        const data = await response.json();
        data.forEach(article => {
          expect(article.category).toBe('announcement');
        });
      }
    });
  });

  describe('Admin News Management', () => {
    const testArticle = {
      title: 'Test News Article',
      description: 'This is a test news article for automated testing.',
      category: 'announcement',
      externalUrl: 'https://example.com',
      isPublished: true
    };

    test('Should create new news article as admin', async () => {
      const response = await fetch(`${baseUrl}/api/admin/news`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify(testArticle)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.title).toBe(testArticle.title);
      expect(data.description).toBe(testArticle.description);
      expect(data.category).toBe(testArticle.category);
      expect(data.id).toBeDefined();
    });

    test('Should reject news creation without admin privileges', async () => {
      const response = await fetch(`${baseUrl}/api/admin/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testArticle)
      });

      expect(response.status).toBe(401);
    });

    test('Should update existing news article as admin', async () => {
      // First create an article
      const createResponse = await fetch(`${baseUrl}/api/admin/news`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify(testArticle)
      });
      
      const createdArticle = await createResponse.json();
      
      // Then update it
      const updatedData = {
        ...testArticle,
        title: 'Updated Test Article',
        isPublished: false
      };
      
      const updateResponse = await fetch(`${baseUrl}/api/admin/news/${createdArticle.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify(updatedData)
      });

      expect(updateResponse.status).toBe(200);
      const updated = await updateResponse.json();
      expect(updated.title).toBe('Updated Test Article');
      expect(updated.isPublished).toBe(false);
    });
  });

  describe('News Content Validation', () => {
    test('Should validate required fields', async () => {
      const incompleteArticle = {
        title: 'Incomplete Article'
        // Missing required fields
      };

      const response = await fetch(`${baseUrl}/api/admin/news`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify(incompleteArticle)
      });

      expect(response.status).toBe(400);
    });

    test('Should validate external URL format if provided', async () => {
      const articleWithBadUrl = {
        title: 'Test Article',
        description: 'Test description',
        category: 'general',
        externalUrl: 'not-a-valid-url',
        isPublished: true
      };

      const response = await fetch(`${baseUrl}/api/admin/news`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify(articleWithBadUrl)
      });

      expect(response.status).toBe(400);
    });
  });
});