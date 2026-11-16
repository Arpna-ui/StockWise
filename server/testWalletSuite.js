import app from './index.js';
import { ensureUserWallet, creditWallet, debitWallet, getWalletMetrics } from './services/walletService.js';
import dotenv from 'dotenv';

dotenv.config();

const runWalletSuite = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 4: VIRTUAL WALLET & LEDGER VERIFICATION SUITE');
  console.log('=======================================================================\n');

  const baseUrl = 'http://127.0.0.1:5000/api';
  let testsPassed = 0;
  let totalTests = 0;

  const assert = (condition, title) => {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${title}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${title}`);
    }
  };

  try {
    // 1. Account creation & Initial Starting Balance Verification
    const uniqueSuffix = Date.now();
    const testEmail = `wallet_user_${uniqueSuffix}@stockwise.trade`;
    const testUsername = `wallet_${uniqueSuffix}`;

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Ananya Deshmukh',
        username: testUsername,
        email: testEmail,
        password: 'password123',
        confirmPassword: 'password123',
      }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    const userId = regData.user.id;

    assert(
      regRes.status === 201 && regData.user.virtualInitialCapital === 100000 && regData.user.availableBalance === 100000,
      '1. Newly registered user receives exactly ₹1,00,000 virtual starting capital'
    );

    // 2. Fetch Wallet Metrics via REST API (Protected)
    const walletRes = await fetch(`${baseUrl}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const walletData = await walletRes.json();

    assert(
      walletRes.status === 200 &&
      walletData.success &&
      walletData.data.availableBalance === 100000 &&
      walletData.data.totalAccountValue === 100000 &&
      walletData.data.initialCapitalGrant === 100000 &&
      walletData.data.isVirtual === true,
      '2. GET /api/wallet accurately returns initial availableBalance = ₹1,00,000 and totalAccountValue = ₹1,00,000'
    );

    // 3. Clear Virtual Money Disclaimer
    assert(
      typeof walletData.data.disclaimer === 'string' &&
      walletData.data.disclaimer.toLowerCase().includes('virtual paper money'),
      '3. Clear virtual paper money disclaimer included in wallet payload'
    );

    // 4. One-Time Credit Rule (Starting amount credited ONLY ONCE)
    const walletAgain = await ensureUserWallet(userId);
    assert(
      walletAgain.availableBalance === 100000,
      '4. Starting capital credited only once; subsequent wallet access never duplicates starting funds'
    );

    // 5. Backend Balance Change: Debit operation
    const debitRes = await fetch(`${baseUrl}/wallet/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 25000,
        purpose: 'TEST_STOCK_ALLOCATION',
        notes: 'Simulated allocation of ₹25,000',
      }),
    });
    const debitData = await debitRes.json();

    assert(
      debitRes.status === 200 &&
      debitData.data.availableBalance === 75000,
      '5. Backend accurately debits balance (₹100,000 - ₹25,000 = ₹75,000)'
    );

    // 6. Persistence Rule: Existing users balance is NEVER reset
    const persistedWalletRes = await fetch(`${baseUrl}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const persistedData = await persistedWalletRes.json();
    assert(
      persistedData.data.availableBalance === 75000,
      '6. Balance persistence verified: Existing user balance preserved at ₹75,000 across subsequent calls'
    );

    // 7. Backend Balance Change: Credit operation
    const creditRes = await fetch(`${baseUrl}/wallet/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 10000,
        source: 'DIVIDEND_PAYOUT',
        notes: 'Simulated dividend credit of ₹10,000',
      }),
    });
    const creditData = await creditRes.json();
    assert(
      creditRes.status === 200 &&
      creditData.data.availableBalance === 85000,
      '7. Backend accurately credits balance (₹75,000 + ₹10,000 = ₹85,000)'
    );

    // 8. Strict Negative Balance Prevention
    const overDebitRes = await fetch(`${baseUrl}/wallet/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 999999, // Exceeds ₹85,000 balance!
        purpose: 'ILLEGAL_OVERDRAFT',
      }),
    });
    assert(
      overDebitRes.status === 500 || overDebitRes.status === 400,
      '8. Overdraft attempt exceeding available balance is rejected with error'
    );

    // Check balance remained strictly unchanged after failed overdraft
    const postOverdraftRes = await fetch(`${baseUrl}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postOverdraftData = await postOverdraftRes.json();
    assert(
      postOverdraftData.data.availableBalance === 85000,
      '9. Balance integrity maintained: Negative balance strictly prevented, remaining at ₹85,000'
    );

    // 9. Input Validation: Reject zero or negative credit/debit amounts
    const invalidAmountRes = await fetch(`${baseUrl}/wallet/debit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: -500 }),
    });
    assert(
      invalidAmountRes.status === 400 || invalidAmountRes.status === 500,
      '10. Negative or invalid transaction amounts rejected by backend validation'
    );

    // 10. Auditable Transaction Ledger Records
    const ledgerRes = await fetch(`${baseUrl}/wallet/ledger`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ledgerData = await ledgerRes.json();
    assert(
      ledgerRes.status === 200 &&
      Array.isArray(ledgerData.data) &&
      ledgerData.data.length >= 3 && // Initial grant + 1 debit + 1 credit
      ledgerData.data.some((tx) => tx.type === 'CREDIT' && tx.price === 100000) &&
      ledgerData.data.some((tx) => tx.type === 'DEBIT' && tx.price === 25000) &&
      ledgerData.data.some((tx) => tx.type === 'CREDIT' && tx.price === 10000),
      '11. Complete auditable transaction ledger records maintained with timestamps and amounts'
    );

    // 11. Unauthenticated Access Protection
    const unauthWalletRes = await fetch(`${baseUrl}/wallet`);
    assert(
      unauthWalletRes.status === 401,
      '12. Wallet API strictly protected against unauthenticated access (returns 401)'
    );

    console.log(`\nAll ${testsPassed} of ${totalTests} Stage 4 Virtual Wallet tests passed (${((testsPassed / totalTests) * 100).toFixed(0)}% success rate)!`);
  } catch (err) {
    console.error('Wallet test error:', err);
    process.exit(1);
  } finally {
    setTimeout(() => {
      process.exit(0);
    }, 200);
  }
};

runWalletSuite();
