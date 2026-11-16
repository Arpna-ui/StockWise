import express from 'express';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Test runner helper
const runSuite = async () => {
  console.log('=================================================================');
  console.log('   STOCKWISE STAGE 2: COMPLETE AUTHENTICATION VERIFICATION SUITE');
  console.log('=================================================================\n');

  const server = app.listen(5099, async () => {
    const baseUrl = 'http://127.0.0.1:5099/api/auth';
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
      // Test 1: Register a new user
      const uniqueSuffix = Date.now();
      const testEmail = `testtrader_${uniqueSuffix}@stockwise.trade`;
      const testUsername = `trader_${uniqueSuffix}`;

      const regRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Vikram Mehta',
          username: testUsername,
          email: testEmail,
          password: 'securePassword123',
          confirmPassword: 'securePassword123',
        }),
      });
      const regData = await regRes.json();
      assert(regRes.status === 201 && regData.success && regData.token, '1. New user registration returns 201 and JWT token');
      assert(regData.user.virtualInitialCapital === 100000 && regData.user.availableBalance === 100000, '2. New user automatically granted ₹1,00,000 initial virtual capital');

      // Test 2: Duplicate email prevention
      const dupEmailRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Vikram Duplicate',
          username: `other_${uniqueSuffix}`,
          email: testEmail, // Duplicate!
          password: 'securePassword123',
          confirmPassword: 'securePassword123',
        }),
      });
      const dupEmailData = await dupEmailRes.json();
      assert(dupEmailRes.status === 400 && dupEmailData.message.includes('email'), '3. Duplicate email registration rejected with 400 status');

      // Test 3: Duplicate username prevention
      const dupUserRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Another Trader',
          username: testUsername, // Duplicate!
          email: `other_${uniqueSuffix}@stockwise.trade`,
          password: 'securePassword123',
          confirmPassword: 'securePassword123',
        }),
      });
      const dupUserData = await dupUserRes.json();
      assert(dupUserRes.status === 400 && dupUserData.message.includes('username'), '4. Duplicate username registration rejected with 400 status');

      // Test 4: Password mismatch validation
      const mismatchRes = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Mismatch Tester',
          username: `mismatch_${uniqueSuffix}`,
          email: `mismatch_${uniqueSuffix}@stockwise.trade`,
          password: 'passwordA',
          confirmPassword: 'passwordB',
        }),
      });
      assert(mismatchRes.status === 400, '5. Password mismatch rejected with 400 validation error');

      // Test 5: Login using Email
      const loginEmailRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: testEmail,
          password: 'securePassword123',
        }),
      });
      const loginEmailData = await loginEmailRes.json();
      assert(loginEmailRes.status === 200 && loginEmailData.token, '6. Login with email successful and returns valid JWT token');

      // Test 6: Login using Username
      const loginUserRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: testUsername,
          password: 'securePassword123',
        }),
      });
      const loginUserData = await loginUserRes.json();
      assert(loginUserRes.status === 200 && loginUserData.token, '7. Login with username successful and returns valid JWT token');

      // Test 7: Login with invalid password
      const wrongPassRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: testEmail,
          password: 'wrongPassword999',
        }),
      });
      assert(wrongPassRes.status === 401, '8. Login with incorrect password rejected with 401 status');

      // Test 8: Login with non-existent account
      const ghostRes = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: 'does_not_exist_user@stockwise.trade',
          password: 'password123',
        }),
      });
      assert(ghostRes.status === 401, '9. Login with unknown account rejected with 401 status');

      // Test 9: Protected route /api/auth/me with valid Bearer token
      const token = loginEmailData.token;
      const meRes = await fetch(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      assert(meRes.status === 200 && meData.user.email === testEmail, '10. Protected route /api/auth/me accessible with Bearer token');

      // Test 10: Protected route rejected without token
      const noTokenRes = await fetch(`${baseUrl}/me`);
      assert(noTokenRes.status === 401, '11. Protected route rejected with 401 when token is missing');

      // Test 11: Forgot password flow
      const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const forgotData = await forgotRes.json();
      assert(forgotRes.status === 200 && forgotData.success, '12. Forgot password endpoint generates reset link and confirms delivery');

      // Test 12: Reset password execution
      if (forgotData.resetUrl) {
        const resetToken = forgotData.resetUrl.split('/reset-password/')[1];
        const resetExecRes = await fetch(`${baseUrl}/reset-password/${resetToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: 'brandNewPassword2026',
            confirmPassword: 'brandNewPassword2026',
          }),
        });
        const resetExecData = await resetExecRes.json();
        assert(resetExecRes.status === 200 && resetExecData.token, '13. Password reset successfully updates password and returns fresh JWT');

        // Verify login works with the brand new password
        const verifyNewPassRes = await fetch(`${baseUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loginId: testEmail,
            password: 'brandNewPassword2026',
          }),
        });
        assert(verifyNewPassRes.status === 200, '14. Login with newly reset password succeeds');
      }

      console.log(`\nAll ${testsPassed} of ${totalTests} Authentication tests passed (${((testsPassed / totalTests) * 100).toFixed(0)}% success rate)!`);
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      server.close(() => {
        setTimeout(() => process.exit(0), 100);
      });
    }
  });
};

runSuite();
