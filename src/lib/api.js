import { buildAnalytics, displayName } from "./analytics.mjs";

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error("Server returned no data. Make sure the backend is running with npm start.");
    }
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server returned an invalid response instead of JSON.");
  }
}

function authHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem("hanzalah-session"));
    return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
  } catch {
    return {};
  }
}

export async function login(username, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to login.");
  return data;
}

export async function loadDashboardData() {
  const response = await fetch("/api/store", { headers: authHeaders() });
  const store = await readJsonResponse(response);

  if (response.status === 401) {
    localStorage.removeItem("hanzalah-session");
    throw new Error("SESSION_EXPIRED");
  }

  if (!response.ok) {
    throw new Error(store.error || "Unable to load store data.");
  }

  return {
    ...store,
    products: store.products.map(row => ({ ...row, name: displayName(row.name), category: displayName(row.category) })),
    sales: store.sales.map(row => ({ ...row, productName: displayName(row.productName) })),
    refunds: (store.refunds || []).map(row => ({ ...row, productName: displayName(row.productName) })),
    purchases: (store.purchases || []).map(row => ({ ...row, productName: displayName(row.productName) })),
    analytics: buildAnalytics(store),
    orders: store.orders || [],
    customersView: [
      ...store.customers.map(customer => ({
        ...customer,
        email: customer.email || "",
        orders: (store.orders || []).filter(order => order.customer === customer.name).length
      }))
    ]
  };
}

export async function createOrder(order) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(order)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to create order.");
  return data;
}

export async function findProductByBarcode(barcode) {
  const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`, { headers: authHeaders() });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "No product found for this barcode.");
  return { ...data, name: displayName(data.name), category: displayName(data.category) };
}

export async function saveProduct(product) {
  const payload = { ...product };
  const id = payload.id;
  delete payload.id;

  const response = await fetch(id ? `/api/products/${id}` : "/api/products", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to save product.");
  return data;
}

export async function recordSale(sale) {
  const response = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(sale)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to record sale.");
  return data;
}

export async function createContact(contact) {
  const response = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(contact)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to save contact.");
  return data;
}

export async function updateContact(id, contact) {
  const response = await fetch(`/api/contacts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(contact)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to update contact.");
  return data;
}

export async function recordPurchase(purchase) {
  const response = await fetch("/api/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(purchase)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to record purchase.");
  return data;
}

export async function recordRefund(refund) {
  const response = await fetch("/api/refunds", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(refund)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to record refund.");
  return data;
}

export async function saveSettings(settings) {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(settings)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to save settings.");
  return data;
}

export async function saveUser(user) {
  const id = user.id;
  const payload = { ...user };
  delete payload.id;
  const response = await fetch(id ? `/api/users/${id}` : "/api/users", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(data.error || "Unable to save user.");
  return data;
}



export async function logout() {
 const response = await fetch("/api/auth/logout", { method: "POST", headers: authHeaders() });
 if (!response.ok && response.status !== 401) throw new Error("Unable to log out. Please retry.");
}
