/**
 * Presale Functionality Test Cases
 * Tests for presale configuration, countdown timer, and liquidity tracking
 */

describe('Presale Tests', () => {
  const baseUrl = 'http://localhost:5000';
  let adminSessionCookie;
  let userSessionCookie;

  beforeAll(async () => {
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

    // Login as user
    const userLoginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
      })
    });
    userSessionCookie = userLoginResponse.headers.get('set-cookie');
  });

  describe('Presale Configuration', () => {
    test('Should fetch presale configuration', async () => {
      const response = await fetch(`${baseUrl}/api/presale/config`);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.targetAmount).toBeDefined();
      expect(data.currentAmount).toBeDefined();
      expect(data.initialLiquidity).toBeDefined();
      expect(data.startDate).toBeDefined();
      expect(data.endDate).toBeDefined();
      expect(data.isActive).toBeDefined();
      
      // Validate amounts are valid decimals
      expect(parseFloat(data.targetAmount)).not.toBeNaN();
      expect(parseFloat(data.currentAmount)).not.toBeNaN();
      expect(parseFloat(data.initialLiquidity)).not.toBeNaN();
    });

    test('Should calculate presale progress correctly', async () => {
      const response = await fetch(`${baseUrl}/api/presale/config`);
      const data = await response.json();
      
      const progress = (parseFloat(data.currentAmount) + parseFloat(data.initialLiquidity)) / parseFloat(data.targetAmount) * 100;
      
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    test('Should validate presale dates', async () => {
      const response = await fetch(`${baseUrl}/api/presale/config`);
      const data = await response.json();
      
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });
  });

  describe('Admin Presale Management', () => {
    test('Should update presale configuration as admin', async () => {
      const updatedConfig = {
        targetAmount: '2000000',
        initialLiquidity: '100000',
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days from now
      };

      const response = await fetch(`${baseUrl}/api/admin/presale/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': adminSessionCookie 
        },
        body: JSON.stringify(updatedConfig)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.targetAmount).toBe(updatedConfig.targetAmount);
      expect(data.initialLiquidity).toBe(updatedConfig.initialLiquidity);
    });

    test('Should reject presale config update without admin privileges', async () => {
      const updatedConfig = {
        targetAmount: '500000'
      };

      const response = await fetch(`${baseUrl}/api/admin/presale/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(updatedConfig)
      });

      expect(response.status).toBe(403);
    });

    test('Should update current liquidity amount as admin', async () => {
      const updateData = {
        currentAmount: '150000'
      };

      const response = await fetch(`${baseUrl}/api/admin/presale/liquidity`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': adminSessionCookie 
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.currentAmount).toBe(updateData.currentAmount);
    });
  });

  describe('Presale Timer', () => {
    test('Should calculate time remaining correctly', async () => {
      const response = await fetch(`${baseUrl}/api/presale/timer`);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.timeRemaining).toBeDefined();
      expect(data.days).toBeDefined();
      expect(data.hours).toBeDefined();
      expect(data.minutes).toBeDefined();
      expect(data.seconds).toBeDefined();
      expect(data.isEnded).toBeDefined();
      
      // Validate timer values
      expect(data.days).toBeGreaterThanOrEqual(0);
      expect(data.hours).toBeGreaterThanOrEqual(0);
      expect(data.hours).toBeLessThan(24);
      expect(data.minutes).toBeGreaterThanOrEqual(0);
      expect(data.minutes).toBeLessThan(60);
      expect(data.seconds).toBeGreaterThanOrEqual(0);
      expect(data.seconds).toBeLessThan(60);
    });

    test('Should handle presale end correctly', async () => {
      // Set presale end date to past (temporarily for testing)
      const pastEndDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      await fetch(`${baseUrl}/api/admin/presale/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': adminSessionCookie 
        },
        body: JSON.stringify({ endDate: pastEndDate })
      });

      const response = await fetch(`${baseUrl}/api/presale/timer`);
      const data = await response.json();
      
      expect(data.isEnded).toBe(true);
      expect(data.timeRemaining).toBe(0);
      
      // Reset to future date
      const futureEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await fetch(`${baseUrl}/api/admin/presale/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': adminSessionCookie 
        },
        body: JSON.stringify({ endDate: futureEndDate })
      });
    });
  });

  describe('Liquidity Progress', () => {
    test('Should track liquidity progress accurately', async () => {
      const response = await fetch(`${baseUrl}/api/presale/progress`);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.totalRaised).toBeDefined();
      expect(data.targetAmount).toBeDefined();
      expect(data.progressPercentage).toBeDefined();
      expect(data.initialLiquidity).toBeDefined();
      expect(data.fromDeposits).toBeDefined();
      
      // Validate calculations
      const calculatedTotal = parseFloat(data.initialLiquidity) + parseFloat(data.fromDeposits);
      expect(parseFloat(data.totalRaised)).toBe(calculatedTotal);
      
      const calculatedProgress = (calculatedTotal / parseFloat(data.targetAmount)) * 100;
      expect(data.progressPercentage).toBeCloseTo(calculatedProgress, 2);
    });

    test('Should update progress when deposits are approved', async () => {
      // Get initial progress
      const initialResponse = await fetch(`${baseUrl}/api/presale/progress`);
      const initialData = await initialResponse.json();
      
      // Create and approve a deposit
      const depositData = {
        amount: '1000.00',
        transactionHash: '0xprogresstest123'
      };

      const depositResponse = await fetch(`${baseUrl}/api/deposits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(depositData)
      });

      const deposit = await depositResponse.json();

      // Approve the deposit
      await fetch(`${baseUrl}/api/admin/deposits/${deposit.id}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': adminSessionCookie 
        },
        body: JSON.stringify({ adminNotes: 'Test approval' })
      });

      // Check updated progress
      const updatedResponse = await fetch(`${baseUrl}/api/presale/progress`);
      const updatedData = await updatedResponse.json();
      
      expect(parseFloat(updatedData.fromDeposits)).toBeGreaterThan(parseFloat(initialData.fromDeposits));
    });
  });

  describe('Withdrawal Restrictions', () => {
    test('Should prevent withdrawals during presale', async () => {
      const withdrawalData = {
        amount: '50.00',
        toAddress: '0x1234567890abcdef'
      };

      const response = await fetch(`${baseUrl}/api/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': userSessionCookie 
        },
        body: JSON.stringify(withdrawalData)
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toContain('presale');
    });

    test('Should show withdrawal unavailable message', async () => {
      const response = await fetch(`${baseUrl}/api/withdraw/status`, {
        headers: { 'Cookie': userSessionCookie }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.available).toBe(false);
      expect(data.reason).toContain('presale');
    });
  });
});