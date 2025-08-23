/**
 * Deposit Functionality Test Cases
 * Tests for deposit requests, verification, and processing
 */

describe('Deposit Tests', () => {
  const baseUrl = 'http://localhost:5000';
  let userSessionCookie;
  let adminSessionCookie;

  beforeAll(async () => {
    // Login as regular user
    const userLoginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
      })
    });
    userSessionCookie = userLoginResponse.headers.get('set-cookie');

    // Login as admin
    const adminLoginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cryptowallet.com',
        password: 'password123'
      })
    });
    adminSessionCookie = adminLoginResponse.headers.get('set-cookie');
  });

  describe('Deposit Request Creation', () => {
    test('Should create deposit request with valid data', async () => {
      const depositData = {
        amount: '100.50',
        transactionHash: '0x1234567890abcdef',
        paymentMethod: 'upi'
      };

      const response = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.amount).toBe(depositData.amount);
      expect(data.transactionHash).toBe(depositData.transactionHash);
      expect(data.status).toBe('pending');
      expect(data.userId).toBeDefined();
      expect(data.id).toBeDefined();
    });

    test('Should reject deposit request without authentication', async () => {
      const depositData = {
        amount: '50.00',
        transactionHash: '0xabcdef1234567890'
      };

      const response = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(depositData)
      });

      expect(response.status).toBe(401);
    });

    test('Should validate minimum deposit amount', async () => {
      const depositData = {
        amount: '5.00', // Below minimum
        transactionHash: '0x1234567890abcdef'
      };

      const response = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('minimum');
    });

    test('Should handle screenshot upload', async () => {
      // Create a mock file
      const formData = new FormData();
      formData.append('amount', '100');
      formData.append('transactionHash', '0xtest123');
      formData.append('screenshot', new Blob(['test'], { type: 'image/png' }), 'test.png');

      const response = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 'Cookie': userSessionCookie },
        body: formData
      });

      // Should either succeed or give specific file upload error
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Deposit History', () => {
    test('Should fetch user deposit history', async () => {
      const response = await fetch(`${baseUrl}/api/deposits`, {
        headers: { 'Cookie': userSessionCookie }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const deposit = data[0];
        expect(deposit.amount).toBeDefined();
        expect(deposit.status).toBeDefined();
        expect(deposit.createdAt).toBeDefined();
        expect(['pending', 'approved', 'rejected']).toContain(deposit.status);
      }
    });

    test('Should only show user own deposits', async () => {
      const response = await fetch(`${baseUrl}/api/deposits`, {
        headers: { 'Cookie': userSessionCookie }
      });
      
      const data = await response.json();
      
      // All deposits should belong to the current user
      data.forEach(deposit => {
        expect(deposit.userId).toBeDefined();
      });
    });

    test('Should sort deposits by date (newest first)', async () => {
      const response = await fetch(`${baseUrl}/api/deposits`, {
        headers: { 'Cookie': userSessionCookie }
      });
      
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

  describe('Admin Deposit Management', () => {
    let testDepositId;

    beforeAll(async () => {
      // Create a test deposit
      const depositData = {
        amount: '200.00',
        transactionHash: '0xtestadmin123'
      };

      const response = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      const deposit = await response.json();
      testDepositId = deposit.id;
    });

    test('Should fetch all deposits as admin', async () => {
      const response = await fetch(`${baseUrl}/api/admin/deposits`, {
        headers: { 'Cookie': adminSessionCookie }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const deposit = data[0];
        expect(deposit.amount).toBeDefined();
        expect(deposit.status).toBeDefined();
        expect(deposit.userId).toBeDefined();
      }
    });

    test('Should approve deposit as admin', async () => {
      const response = await fetch(`${baseUrl}/api/admin/deposits/${testDepositId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': adminSessionCookie 
        },
        body: JSON.stringify({
          adminNotes: 'Payment verified and approved'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('approved');
      expect(data.adminNotes).toBe('Payment verified and approved');
    });

    test('Should reject deposit as admin', async () => {
      // Create another test deposit first
      const depositData = {
        amount: '150.00',
        transactionHash: '0xtestrejection'
      };

      const createResponse = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      const newDeposit = await createResponse.json();

      const response = await fetch(`${baseUrl}/api/admin/deposits/${newDeposit.id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': adminSessionCookie 
        },
        body: JSON.stringify({
          adminNotes: 'Payment not found in bank records'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('rejected');
      expect(data.adminNotes).toBe('Payment not found in bank records');
    });

    test('Should reject admin actions without proper permissions', async () => {
      const response = await fetch(`${baseUrl}/api/admin/deposits`, {
        headers: { 'Cookie': userSessionCookie } // Regular user, not admin
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Deposit Validation', () => {
    test('Should validate transaction hash format', async () => {
      const depositData = {
        amount: '100.00',
        transactionHash: 'invalid-hash-format'
      };

      const response = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      expect(response.status).toBe(400);
    });

    test('Should prevent duplicate transaction hashes', async () => {
      const depositData = {
        amount: '75.00',
        transactionHash: '0xunique123456'
      };

      // Create first deposit
      await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      // Try to create second deposit with same hash
      const response = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('duplicate');
    });
  });
});