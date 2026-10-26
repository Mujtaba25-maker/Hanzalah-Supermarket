// Passwords are supplied only when initializing an empty user collection.
// Existing accounts are never changed by bootstrap configuration.
function configuredBootstrapUsers(env) {
  const users = [
    { name: 'Owner / Admin', username: 'admin', role: 'admin', key: 'BOOTSTRAP_ADMIN_PASSWORD' },
    { name: 'Manager', username: 'manager', role: 'manager', key: 'BOOTSTRAP_MANAGER_PASSWORD' },
    { name: 'Cashier', username: 'cashier', role: 'cashier', key: 'BOOTSTRAP_CASHIER_PASSWORD' }
  ];
  if (!env.BOOTSTRAP_ADMIN_PASSWORD) {
    throw new Error('An empty user collection requires BOOTSTRAP_ADMIN_PASSWORD. Set a unique password of at least 12 characters.');
  }
  return users.filter(user => env[user.key]).map(({ key, ...user }) => {
    const password = env[key];
    if (password.length < 12) throw new Error(`${key} must contain at least 12 characters.`);
    return { ...user, password };
  });
}
module.exports = { configuredBootstrapUsers };
