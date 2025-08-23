/**
 * Authentication Test Cases
 * Tests for user registration, login, and authentication flows
 */

describe('Authentication Tests', () => {
  const baseUrl = 'http://localhost:5000';
  
  // Test user credentials
  const testUser = {
    name: 'Test User',
    username: 'testuser123',
    email: 'test@example.com',
    password: 'password123',
    phone: '+1234567890'
  };

  const adminUser = {
    email: 'admin@cryptowallet.com',
    password: 'password123'
  };

  describe('User Registration', () => {
    test('Should create new user account successfully', async () => {
      const response = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.username).toBe(testUser.username);
      expect(data.user.walletAddress).toBeDefined();
      expect(data.user.password).toBeUndefined(); // Should not return password
    });

    test('Should reject registration with existing email', async () => {
      // Try to register with same email again
      const response = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('already exists');
    });

    test('Should validate required fields', async () => {
      const incompleteUser = {
        email: 'incomplete@test.com'
        // Missing required fields
      };

      const response = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteUser)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('User Login', () => {
    test('Should login with valid credentials', async () => {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUser.email,
          password: adminUser.password
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(adminUser.email);
      expect(data.user.isAdmin).toBe(true);
      expect(data.user.password).toBeUndefined();
    });

    test('Should reject invalid credentials', async () => {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUser.email,
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toContain('Invalid');
    });

    test('Should reject login with non-existent email', async () => {
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Session Management', () => {
    let sessionCookie;

    beforeAll(async () => {
      // Login to get session cookie
      const response = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminUser)
      });
      
      sessionCookie = response.headers.get('set-cookie');
    });

    test('Should access protected route with valid session', async () => {
      const response = await fetch(`${baseUrl}/api/user`, {
        headers: { 'Cookie': sessionCookie }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.email).toBe(adminUser.email);
    });

    test('Should reject access without session', async () => {
      const response = await fetch(`${baseUrl}/api/user`);
      expect(response.status).toBe(401);
    });

    test('Should logout successfully', async () => {
      const response = await fetch(`${baseUrl}/api/logout`, {
        method: 'POST',
        headers: { 'Cookie': sessionCookie }
      });

      expect(response.status).toBe(200);
    });
  });
});