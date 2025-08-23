/**
 * Token Details Test Cases
 * Tests for token configuration, price data, and related functionality
 */

describe('Token Details Tests', () => {
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

  describe('Token Configuration', () => {
    test('Should fetch token configuration', async () => {
      const response = await fetch(`${baseUrl}/api/token/config`);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toBeDefined();
      expect(data.contractAddress).toBeDefined();
      expect(data.tokenName).toBe('CryptoWallet Pro Token');
      expect(data.tokenSymbol).toBe('CWP');
      expect(data.decimals).toBe(18);
      expect(data.isActive).toBe(true);
    });

    test('Should update token configuration as admin', async () => {
      const updatedConfig = {
        contractAddress: '0xfd7625937b265ba9550dc39f74af85da56b7770b',
        tokenName: 'Updated Token Name',
        tokenSymbol: 'UPD',
        decimals: 18
      };

      const response = await fetch(`${baseUrl}/api/admin/token/config`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': sessionCookie 
        },
        body: JSON.stringify(updatedConfig)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tokenName).toBe(updatedConfig.tokenName);
      expect(data.tokenSymbol).toBe(updatedConfig.tokenSymbol);
    });
  });

  describe('Token Price Data', () => {
    test('Should fetch token price information', async () => {
      const response = await fetch(`${baseUrl}/api/token/price`);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toBeDefined();
      expect(data.priceUsd).toBeDefined();
      expect(data.priceChange24h).toBeDefined();
      expect(data.volume24h).toBeDefined();
      expect(data.marketCap).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    test('Should validate price format', async () => {
      const response = await fetch(`${baseUrl}/api/token/price`);
      const data = await response.json();
      
      // Price should be a valid decimal string
      expect(parseFloat(data.priceUsd)).not.toBeNaN();
      expect(parseFloat(data.priceChange24h)).not.toBeNaN();
    });
  });

  describe('Token Balance', () => {
    test('Should fetch user token balance with authentication', async () => {
      const response = await fetch(`${baseUrl}/api/user/token/balance`, {
        headers: { 'Cookie': sessionCookie }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toBeDefined();
      expect(data.balance).toBeDefined();
    });

    test('Should reject balance request without authentication', async () => {
      const response = await fetch(`${baseUrl}/api/user/token/balance`);
      expect(response.status).toBe(401);
    });
  });

  describe('Contract Address Validation', () => {
    test('Should validate BEP-20 contract address format', async () => {
      const response = await fetch(`${baseUrl}/api/token/config`);
      const data = await response.json();
      
      // BEP-20 addresses should start with 0x and be 42 characters long
      expect(data.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('Should ensure contract address matches token details', async () => {
      const configResponse = await fetch(`${baseUrl}/api/token/config`);
      const configData = await configResponse.json();
      
      const priceResponse = await fetch(`${baseUrl}/api/token/price`);
      const priceData = await priceResponse.json();
      
      // Both should reference the same token
      expect(priceData.tokenConfigId).toBe(configData.id);
    });
  });
});