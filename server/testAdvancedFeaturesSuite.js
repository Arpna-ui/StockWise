import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const runAdvancedFeaturesSuite = async () => {
  console.log('=======================================================================');
  console.log('   STOCKWISE STAGE 9: ADVANCED FEATURES & USER EXPERIENCE SUITE');
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
    // -------------------------------------------------------------------------
    // 1. User Registration & Initial Capital Verification
    // -------------------------------------------------------------------------
    const suffix = Date.now();
    const userEmail = `adv_trader_${suffix}@stockwise.trade`;
    const initialPassword = 'Password@123';
    const updatedPassword = 'NewSecurePass@2026';

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Devendra Kulkarni',
        username: `adv_user_${suffix}`,
        email: userEmail,
        password: initialPassword,
        confirmPassword: initialPassword,
      }),
    });
    const regData = await regRes.json();
    let token = regData.token;
    const userId = regData.user._id;

    assert(
      regRes.status === 201 && token,
      '1. User registered successfully with JWT session token'
    );

    // -------------------------------------------------------------------------
    // 2. Market News - Verification of Authentic News Feed
    // -------------------------------------------------------------------------
    const newsRes = await fetch(`${baseUrl}/news`);
    const newsData = await newsRes.json();

    assert(
      newsRes.status === 200 &&
      newsData.success &&
      Array.isArray(newsData.data) &&
      newsData.data.length >= 8 &&
      newsData.data.every((a) => a.title && a.summary && a.source && a.url && a.publishedAt),
      '2. GET /api/news returns authentic articles with headlines, summaries, sources, dates & links'
    );

    // -------------------------------------------------------------------------
    // 3. Market News - Category Filtering
    // -------------------------------------------------------------------------
    const catRes = await fetch(`${baseUrl}/news?category=Technology`);
    const catData = await catRes.json();

    assert(
      catRes.status === 200 &&
      catData.success &&
      catData.data.length > 0 &&
      catData.data.every((a) => a.category === 'Technology'),
      '3. GET /api/news?category=Technology successfully filters articles by sector category'
    );

    // -------------------------------------------------------------------------
    // 4. Market News - Stock Symbol Filtering
    // -------------------------------------------------------------------------
    const symRes = await fetch(`${baseUrl}/news?symbol=RELIANCE`);
    const symData = await symRes.json();

    assert(
      symRes.status === 200 &&
      symData.success &&
      symData.data.length > 0 &&
      symData.data.some((a) => (a.relatedSymbols || []).includes('RELIANCE')),
      '4. GET /api/news?symbol=RELIANCE filters company-specific news articles'
    );

    // -------------------------------------------------------------------------
    // 5. Watchlist Price Alert Creation
    // -------------------------------------------------------------------------
    const alertRes = await fetch(`${baseUrl}/notifications/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'TCS',
        targetPrice: 4250.00,
        condition: 'ABOVE',
      }),
    });
    const alertData = await alertRes.json();

    assert(
      alertRes.status === 201 &&
      alertData.success &&
      alertData.data.title.includes('TCS'),
      '5. POST /api/notifications/alerts creates custom watchlist price alert notification'
    );

    // -------------------------------------------------------------------------
    // 6. Failed BUY Order Notification (Overdraft / Insufficient Funds)
    // -------------------------------------------------------------------------
    const failBuyRes = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'RELIANCE',
        quantity: 100000, // Cost ~ ₹29 Crores >> ₹1,00,000 balance
        orderType: 'MARKET',
      }),
    });

    assert(
      failBuyRes.status === 400,
      '6. BUY order exceeding virtual cash balance rejected with 400 Bad Request'
    );

    // -------------------------------------------------------------------------
    // 7. Failed SELL Order Notification (Unowned Shares)
    // -------------------------------------------------------------------------
    const failSellRes = await fetch(`${baseUrl}/trade/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'TATAMOTORS',
        quantity: 5, // Not owned
        orderType: 'MARKET',
      }),
    });

    assert(
      failSellRes.status === 400,
      '7. SELL order for unowned stock rejected with 400 Bad Request'
    );

    // -------------------------------------------------------------------------
    // 8. Notification Retrieval & Failed Trade Notifications
    // -------------------------------------------------------------------------
    const notifsRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notifsData = await notifsRes.json();
    const notifications = notifsData.data || [];

    const hasFailedBuyNotif = notifications.some((n) =>
      n.title.includes('Insufficient Funds') && n.title.includes('RELIANCE')
    );
    const hasFailedSellNotif = notifications.some((n) =>
      n.title.includes('Cannot Sell') && n.title.includes('TATAMOTORS')
    );

    assert(
      notifsRes.status === 200 &&
      notifsData.success &&
      notifications.length >= 3 &&
      hasFailedBuyNotif &&
      hasFailedSellNotif,
      '8. GET /api/notifications returns order rejection notifications and price alerts'
    );

    // -------------------------------------------------------------------------
    // 9. Single Notification Mark As Read
    // -------------------------------------------------------------------------
    const targetNotif = notifications[0];
    const markReadRes = await fetch(`${baseUrl}/notifications/${targetNotif._id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    const markReadData = await markReadRes.json();

    assert(
      markReadRes.status === 200 &&
      markReadData.success &&
      markReadData.data.isRead === true,
      '9. PUT /api/notifications/:id/read updates single notification status to isRead: true'
    );

    // -------------------------------------------------------------------------
    // 10. Mark All Notifications As Read
    // -------------------------------------------------------------------------
    const markAllRes = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });

    const verifyAllRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyAllData = await verifyAllRes.json();

    assert(
      markAllRes.status === 200 &&
      verifyAllData.unreadCount === 0 &&
      verifyAllData.data.every((n) => n.isRead === true),
      '10. PUT /api/notifications/read-all marks all notifications as read (unreadCount: 0)'
    );

    // -------------------------------------------------------------------------
    // 11. Delete Single Notification
    // -------------------------------------------------------------------------
    const deleteId = notifications[0]._id;
    const deleteRes = await fetch(`${baseUrl}/notifications/${deleteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const verifyDeleteRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyDeleteData = await verifyDeleteRes.json();

    assert(
      deleteRes.status === 200 &&
      !verifyDeleteData.data.some((n) => n._id.toString() === deleteId.toString()),
      '11. DELETE /api/notifications/:id deletes targeted notification from user history'
    );

    // -------------------------------------------------------------------------
    // 12. Clear All Notifications
    // -------------------------------------------------------------------------
    const clearAllRes = await fetch(`${baseUrl}/notifications`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const verifyClearRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyClearData = await verifyClearRes.json();

    assert(
      clearAllRes.status === 200 &&
      verifyClearData.data.length === 0,
      '12. DELETE /api/notifications clears entire notification history'
    );

    // -------------------------------------------------------------------------
    // 13. User Profile - Get Profile Details
    // -------------------------------------------------------------------------
    const profileRes = await fetch(`${baseUrl}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileData = await profileRes.json();
    const userProfile = profileData.data || profileData.user || {};

    assert(
      profileRes.status === 200 &&
      profileData.success &&
      userProfile.fullName === 'Devendra Kulkarni' &&
      userProfile.initials === 'DK' &&
      userProfile.virtualInitialCapital === 100000 &&
      userProfile.kycStatus === 'Verified Virtual Trader',
      '13. GET /api/users/profile returns profile with initials, KYC status & capital grant'
    );

    // -------------------------------------------------------------------------
    // 14. User Profile - Update Details
    // -------------------------------------------------------------------------
    const updateProfileRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullName: 'Devendra Kulkarni PhD',
        phone: '+91 99887 76655',
        bio: 'Quantitative momentum trader on Indian equities',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    const updatedUser = updateProfileData.data || updateProfileData.user || {};

    assert(
      updateProfileRes.status === 200 &&
      updateProfileData.success &&
      updatedUser.fullName === 'Devendra Kulkarni PhD' &&
      updatedUser.phone === '+91 99887 76655' &&
      updatedUser.bio.includes('Quantitative momentum'),
      '14. PUT /api/users/profile updates user personal info, bio, phone and avatar'
    );

    // -------------------------------------------------------------------------
    // 15. Password Management - Rejection of Incorrect Current Password
    // -------------------------------------------------------------------------
    const wrongPassRes = await fetch(`${baseUrl}/users/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword999',
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      }),
    });

    assert(
      wrongPassRes.status === 401,
      '15. PUT /api/users/password verifies current password and rejects invalid credentials (401)'
    );

    // -------------------------------------------------------------------------
    // 16. Password Management - Successful Update & Re-login
    // -------------------------------------------------------------------------
    const changePassRes = await fetch(`${baseUrl}/users/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      }),
    });
    const changePassData = await changePassRes.json();

    assert(
      changePassRes.status === 200 && changePassData.success,
      '16. PUT /api/users/password successfully hashes and updates account password'
    );

    // Verify login with new password
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: userEmail,
        password: updatedPassword,
      }),
    });
    const loginData = await loginRes.json();
    token = loginData.token;

    assert(
      loginRes.status === 200 && token,
      '17. Login with newly updated bcrypt password succeeds and returns fresh session token'
    );

    // -------------------------------------------------------------------------
    // 18. Virtual Account Reset Flow
    // -------------------------------------------------------------------------
    // First, buy 2 shares of INFY so that cash is reduced and holdings exist
    const buyInfyRes = await fetch(`${baseUrl}/trade/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symbol: 'INFY',
        quantity: 2,
        orderType: 'MARKET',
      }),
    });
    const buyInfyData = await buyInfyRes.json();

    // Now invoke account reset
    const resetRes = await fetch(`${baseUrl}/users/reset-account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const resetData = await resetRes.json();

    // Verify wallet balance restored to ₹1,00,000
    const verifyWalletRes = await fetch(`${baseUrl}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyWalletData = await verifyWalletRes.json();

    // Verify holdings cleared
    const verifyHoldingsRes = await fetch(`${baseUrl}/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const verifyHoldingsData = await verifyHoldingsRes.json();
    const holdings = verifyHoldingsData.data?.holdings || [];

    assert(
      resetRes.status === 200 &&
      resetData.success &&
      verifyWalletData.data.availableBalance === 100000 &&
      holdings.length === 0,
      '18. POST /api/users/reset-account clears holdings and restores virtual ₹1,00,000 cash'
    );

    // -------------------------------------------------------------------------
    // 19. Security: Unauthenticated Access Protection
    // -------------------------------------------------------------------------
    const unauthProfileRes = await fetch(`${baseUrl}/users/profile`);
    const unauthNotifsRes = await fetch(`${baseUrl}/notifications`);
    const unauthResetRes = await fetch(`${baseUrl}/users/reset-account`, { method: 'POST' });

    assert(
      unauthProfileRes.status === 401 &&
      unauthNotifsRes.status === 401 &&
      unauthResetRes.status === 401,
      '19. Security: Unauthenticated requests to /api/users/* and /api/notifications/* rejected with 401'
    );

  } catch (error) {
    console.error('Fatal test error in Stage 9 test suite:', error);
  }

  console.log('\n-----------------------------------------------------------------------');
  console.log(`STAGE 9 TESTS RUN: ${totalTests} | PASSED: ${testsPassed} | FAILED: ${totalTests - testsPassed}`);
  console.log('-----------------------------------------------------------------------');

  if (testsPassed === totalTests && totalTests > 0) {
    console.log('🎉 ALL STAGE 9 ADVANCED FEATURES & UX TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('💥 SOME STAGE 9 TESTS FAILED.\n');
    process.exit(1);
  }
};

runAdvancedFeaturesSuite();
