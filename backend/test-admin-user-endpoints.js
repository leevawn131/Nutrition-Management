/**
 * Automated Verification Test Suite for Admin User Management Endpoints
 * Tests: Authentication, Admin Authorization, User Listing, Search, Filter, Pagination, Details, Role Update, Security Rules
 */

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });

const User = require('./models/user.model');
const app = require('express')();
const cors = require('cors');
const express = require('express');

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const adminUserRoutes = require('./routes/admin/user.admin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin/users', adminUserRoutes);

let server;
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}/api`;

let adminUser;
let regularUser;
let testTargetUser;
let adminToken;
let userToken;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`  ✅ PASSED: ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${name} — ${details}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING ADMIN USER MANAGEMENT TEST SUITE');
  console.log('====================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create / find test users
    adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'test_admin_mgmt@nutrition.app',
        password_hash: 'hashed_admin_pass',
        role: 'admin',
        full_name: 'Test Admin',
      });
    }

    regularUser = await User.findOne({ role: 'user', email: { $ne: 'test_target_user@nutrition.app' } });
    if (!regularUser) {
      regularUser = await User.create({
        email: 'test_regular_user@nutrition.app',
        password_hash: 'hashed_user_pass',
        role: 'user',
        full_name: 'Regular User',
      });
    }

    testTargetUser = await User.findOne({ email: 'test_target_user@nutrition.app' });
    if (!testTargetUser) {
      testTargetUser = await User.create({
        email: 'test_target_user@nutrition.app',
        password_hash: 'hashed_target_pass',
        role: 'user',
        full_name: 'Target Test User',
        gender: 'female',
        height_cm: 160,
        weight_kg: 50,
      });
    }

    const secret = process.env.JWT_SECRET || 'test_jwt_secret';
    adminToken = jwt.sign({ id: adminUser._id }, secret, { expiresIn: '1h' });
    userToken = jwt.sign({ id: regularUser._id }, secret, { expiresIn: '1h' });

    // Start ephemeral test server
    server = app.listen(PORT);

    // ==========================================
    // 1. LIST & AUTH TESTS
    // ==========================================
    console.log('📋 [TEST SUITE 1] Listing, Pagination, Search & Auth');

    // Test 1: Unauthenticated request rejected (401)
    const res1 = await request('GET', '/admin/users');
    assert(res1.status === 401 && res1.body.success === false, '1. Unauthenticated request returns 401 Unauthorized');

    // Test 2: Normal user cannot list users (403)
    const res2 = await request('GET', '/admin/users', null, userToken);
    assert(res2.status === 403 && res2.body.success === false, '2. Normal user request returns 403 Forbidden');

    // Test 3: Admin can list users (200)
    const res3 = await request('GET', '/admin/users', null, adminToken);
    assert(res3.status === 200 && res3.body.success === true && Array.isArray(res3.body.data.users), '3. Admin can list users (200 OK)');

    // Test 4: Pagination works
    const res4 = await request('GET', '/admin/users?page=1&limit=2', null, adminToken);
    assert(
      res4.status === 200 &&
      res4.body.data.pagination.page === 1 &&
      res4.body.data.pagination.limit === 2 &&
      res4.body.data.users.length <= 2,
      '4. Pagination respects page=1 and limit=2'
    );

    // Test 5: Search by email works
    const res5 = await request('GET', `/admin/users?search=${encodeURIComponent(testTargetUser.email)}`, null, adminToken);
    assert(
      res5.status === 200 &&
      res5.body.data.users.some(u => u.email === testTargetUser.email),
      '5. Search by email finds target user'
    );

    // Test 6: Search by full_name works
    const res6 = await request('GET', '/admin/users?search=Target%20Test', null, adminToken);
    assert(
      res6.status === 200 &&
      res6.body.data.users.some(u => u.full_name === 'Target Test User'),
      '6. Search by full_name finds target user'
    );

    // Test 7: Filter by role works (role=admin)
    const res7 = await request('GET', '/admin/users?role=admin', null, adminToken);
    assert(
      res7.status === 200 &&
      res7.body.data.users.every(u => u.role === 'admin'),
      '7. Filter by role=admin returns only admins'
    );

    // Test 8: Filter by role works (role=user)
    const res8 = await request('GET', '/admin/users?role=user', null, adminToken);
    assert(
      res8.status === 200 &&
      res8.body.data.users.every(u => u.role === 'user'),
      '8. Filter by role=user returns only users'
    );

    // Test 9: Invalid page rejected (400)
    const res9 = await request('GET', '/admin/users?page=0', null, adminToken);
    assert(res9.status === 400 && res9.body.success === false, '9. Invalid page=0 rejected with 400 Bad Request');

    // Test 10: Invalid limit rejected (400)
    const res10 = await request('GET', '/admin/users?limit=500', null, adminToken);
    assert(res10.status === 400 && res10.body.success === false, '10. Invalid limit=500 rejected with 400 Bad Request');

    // Test 11: Invalid role rejected (400)
    const res11 = await request('GET', '/admin/users?role=superman', null, adminToken);
    assert(res11.status === 400 && res11.body.success === false, '11. Invalid role=superman rejected with 400 Bad Request');

    // ==========================================
    // 2. USER DETAIL TESTS
    // ==========================================
    console.log('\n🔍 [TEST SUITE 2] User Details & Sensitive Data Protection');

    // Test 12: Admin can get user detail by ID
    const res12 = await request('GET', `/admin/users/${testTargetUser._id}`, null, adminToken);
    assert(
      res12.status === 200 &&
      res12.body.data.user._id === testTargetUser._id.toString() &&
      res12.body.data.user.email === testTargetUser.email,
      '12. Admin can get user detail by valid ID'
    );

    // Test 13: Password hash is NEVER returned
    assert(
      res12.body.data.user.password_hash === undefined,
      '13. Sensitive password_hash is omitted from response'
    );

    // Test 14: Invalid ObjectId rejected (400)
    const res14 = await request('GET', '/admin/users/invalid_id_123', null, adminToken);
    assert(res14.status === 400 && res14.body.success === false, '14. Invalid ObjectId rejected with 400 Bad Request');

    // Test 15: Non-existent user returns 404
    const nonExistentId = new mongoose.Types.ObjectId();
    const res15 = await request('GET', `/admin/users/${nonExistentId}`, null, adminToken);
    assert(res15.status === 404 && res15.body.success === false, '15. Non-existent user returns 404 Not Found');

    // ==========================================
    // 3. ROLE UPDATE & SECURITY RULE TESTS
    // ==========================================
    console.log('\n🛡️ [TEST SUITE 3] Role Update & Security Protections');

    // Test 16: Admin can promote user to admin
    const res16 = await request('PUT', `/admin/users/${testTargetUser._id}/role`, { role: 'admin' }, adminToken);
    assert(
      res16.status === 200 &&
      res16.body.success === true &&
      res16.body.data.user.role === 'admin',
      '16. Admin can promote user to admin role'
    );

    // Test 17: Admin can demote user back to user
    const res17 = await request('PUT', `/admin/users/${testTargetUser._id}/role`, { role: 'user' }, adminToken);
    assert(
      res17.status === 200 &&
      res17.body.success === true &&
      res17.body.data.user.role === 'user',
      '17. Admin can demote target user back to user role'
    );

    // Test 18: Admin CANNOT demote themselves (Self-demotion prevention)
    const res18 = await request('PUT', `/admin/users/${adminUser._id}/role`, { role: 'user' }, adminToken);
    assert(
      res18.status === 400 &&
      res18.body.success === false,
      '18. Admin cannot demote themselves (400 Bad Request)'
    );

    // Test 19: Non-admin cannot update role (403)
    const res19 = await request('PUT', `/admin/users/${testTargetUser._id}/role`, { role: 'admin' }, userToken);
    assert(
      res19.status === 403 &&
      res19.body.success === false,
      '19. Non-admin cannot update user role (403 Forbidden)'
    );

    // Test 20: Invalid role in body rejected (400)
    const res20 = await request('PUT', `/admin/users/${testTargetUser._id}/role`, { role: 'hacker' }, adminToken);
    assert(
      res20.status === 400 &&
      res20.body.success === false,
      '20. Invalid role value rejected (400 Bad Request)'
    );

    console.log('\n====================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (error) {
    console.error('Fatal error during test run:', error);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
