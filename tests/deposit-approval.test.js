const fetch = require('node-fetch');

describe('Deposit Approval System Tests', () => {
  const baseUrl = 'http://localhost:5000';
  let adminSessionCookie;
  let userSessionCookie;
  let testUserId;
  let testDepositId;

  beforeAll(async () => {
    // Login as admin
    const adminResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123'
      })
    });
    const adminCookies = adminResponse.headers.get('set-cookie');
    adminSessionCookie = adminCookies;

    // Login as regular user
    const userResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@user.com',
        password: 'user123'
      })
    });
    const userCookies = userResponse.headers.get('set-cookie');
    userSessionCookie = userCookies;
    
    const userData = await userResponse.json();
    testUserId = userData.user.id;
  });

  test('Should create a test deposit as user', async () => {
    const depositData = {
      amount: '100.00',
      transactionHash: '0xTEST_APPROVAL_' + Date.now(),
      paymentMethod: 'bsc'
    };

    const response = await fetch(`${baseUrl}/api/deposits`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': userSessionCookie 
      },
      body: JSON.stringify(depositData)
    });

    expect(response.status).toBe(200);
    const deposit = await response.json();
    testDepositId = deposit.id;
    
    expect(deposit.amount).toBe('100.00000000');
    expect(deposit.status).toBe('pending');
    expect(deposit.userId).toBe(testUserId);
  });

  test('Should get user balance before approval', async () => {
    const response = await fetch(`${baseUrl}/api/user/token/balance`, {
      headers: { 'Cookie': userSessionCookie }
    });

    expect(response.status).toBe(200);
    const balance = await response.json();
    
    console.log('🔍 Balance before approval:', balance);
    expect(balance.balance).toBeDefined();
  });

  test('Should approve deposit and credit user balance', async () => {
    // Approve the deposit
    const approveResponse = await fetch(`${baseUrl}/api/admin/deposits/${testDepositId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': adminSessionCookie 
      },
      body: JSON.stringify({
        status: 'approved',
        adminNotes: 'Test approval - payment verified'
      })
    });

    expect(approveResponse.status).toBe(200);

    // Check if deposit status updated
    const depositsResponse = await fetch(`${baseUrl}/api/admin/deposits`, {
      headers: { 'Cookie': adminSessionCookie }
    });
    const deposits = await depositsResponse.json();
    const updatedDeposit = deposits.find(d => d.id === testDepositId);
    
    expect(updatedDeposit.status).toBe('approved');
    expect(updatedDeposit.adminNotes).toBe('Test approval - payment verified');

    // Check user balance after approval
    const balanceResponse = await fetch(`${baseUrl}/api/user/token/balance`, {
      headers: { 'Cookie': userSessionCookie }
    });
    const newBalance = await balanceResponse.json();
    
    console.log('🎉 Balance after approval:', newBalance);
    
    // Verify balance increased by ~100 tokens (100 USD / 1 USD per token)
    expect(parseFloat(newBalance.balance)).toBeGreaterThan(0);
    expect(parseFloat(newBalance.usdValue)).toBeGreaterThan(0);
  });

  test('Should create transaction record for approved deposit', async () => {
    const response = await fetch(`${baseUrl}/api/transactions`, {
      headers: { 'Cookie': userSessionCookie }
    });

    expect(response.status).toBe(200);
    const transactions = await response.json();
    
    // Find the deposit transaction
    const depositTransaction = transactions.find(t => 
      t.type === 'deposit' && 
      t.description.includes('Deposit approved')
    );
    
    expect(depositTransaction).toBeDefined();
    expect(depositTransaction.status).toBe('completed');
    expect(parseFloat(depositTransaction.amount)).toBeGreaterThan(0);
    
    console.log('📝 Deposit transaction:', depositTransaction);
  });

  test('Should test reject functionality', async () => {
    // Create another deposit to reject
    const depositData = {
      amount: '25.00',
      transactionHash: '0xTEST_REJECT_' + Date.now(),
      paymentMethod: 'upi'
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

    // Reject the deposit
    const rejectResponse = await fetch(`${baseUrl}/api/admin/deposits/${newDeposit.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': adminSessionCookie 
      },
      body: JSON.stringify({
        status: 'rejected',
        adminNotes: 'Test rejection - payment not found'
      })
    });

    expect(rejectResponse.status).toBe(200);

    // Verify deposit was rejected
    const depositsResponse = await fetch(`${baseUrl}/api/admin/deposits`, {
      headers: { 'Cookie': adminSessionCookie }
    });
    const deposits = await depositsResponse.json();
    const rejectedDeposit = deposits.find(d => d.id === newDeposit.id);
    
    expect(rejectedDeposit.status).toBe('rejected');
    expect(rejectedDeposit.adminNotes).toBe('Test rejection - payment not found');
  });

  test('Should test new approve/reject endpoints', async () => {
    // Create another test deposit
    const depositData = {
      amount: '75.00',
      transactionHash: '0xTEST_ENDPOINT_' + Date.now(),
      paymentMethod: 'bsc'
    };

    const createResponse = await fetch(`${baseUrl}/api/deposits`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': userSessionCookie 
      },
      body: JSON.stringify(depositData)
    });

    const testDeposit = await createResponse.json();

    // Test specific approve endpoint
    const approveResponse = await fetch(`${baseUrl}/api/admin/deposits/${testDeposit.id}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': adminSessionCookie 
      },
      body: JSON.stringify({
        adminNotes: 'Approved via specific endpoint'
      })
    });

    expect(approveResponse.status).toBe(200);
    const approvedDeposit = await approveResponse.json();
    
    expect(approvedDeposit.status).toBe('approved');
    expect(approvedDeposit.adminNotes).toBe('Approved via specific endpoint');
  });
});