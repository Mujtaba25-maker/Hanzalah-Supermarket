const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { configuredBootstrapUsers } = require('../lib/bootstrap');
test('empty account setup requires a configurable admin password', () => {
  assert.throws(() => configuredBootstrapUsers({}), /BOOTSTRAP_ADMIN_PASSWORD/);
  assert.throws(() => configuredBootstrapUsers({ BOOTSTRAP_ADMIN_PASSWORD: 'short' }), /12 characters/);
});
test('only explicitly configured staff accounts are initialized', () => {
  const password = crypto.randomBytes(24).toString('hex');
  const users = configuredBootstrapUsers({ BOOTSTRAP_ADMIN_PASSWORD: password });
  assert.deepEqual(users.map(user => user.role), ['admin']);
  assert.equal(users[0].password, password);
  const staff = configuredBootstrapUsers({ BOOTSTRAP_ADMIN_PASSWORD: password, BOOTSTRAP_CASHIER_PASSWORD: password });
  assert.deepEqual(staff.map(user => user.role), ['admin', 'cashier']);
});
