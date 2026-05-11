const db = require("../lib/database");

function bodyOf(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function sendResult(res, result) {
  if (result.error) {
    res.status(result.status || 400).json({ error: result.error });
    return;
  }
  res.status(result.status || 200).json(result.data);
}

function authToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function can(user, roles) {
  return roles.includes(user.role);
}

function forbidden(res) {
  return res.status(403).json({ error: "You do not have permission for this action." });
}

module.exports = async function handler(req, res) {
  try {
    const parts = Array.isArray(req.query.path) ? req.query.path : [];
    const [resource, id, extra] = parts;

    if (req.method === "POST" && resource === "auth" && id === "login") {
      return sendResult(res, await db.loginUser(bodyOf(req)));
    }

    const user = await db.verifySession(authToken(req));
    if (!user) {
      return res.status(401).json({ error: "Please login to continue." });
    }

    if (req.method === "GET" && resource === "store") {
      return res.status(200).json(await db.getStore());
    }

    if (req.method === "GET" && resource === "products" && id === "barcode" && extra) {
      const product = await db.findProductByBarcode(decodeURIComponent(extra));
      if (!product) return res.status(404).json({ error: "No product found for this barcode." });
      return res.status(200).json(product);
    }

    if (req.method === "POST" && resource === "products" && !id) {
      if (!can(user, ["admin", "manager"])) return forbidden(res);
      return sendResult(res, await db.createProduct(bodyOf(req), user));
    }

    if (req.method === "PUT" && resource === "products" && id) {
      if (!can(user, ["admin", "manager"])) return forbidden(res);
      return sendResult(res, await db.updateProduct(id, bodyOf(req), user));
    }

    if (req.method === "DELETE" && resource === "products" && id) {
      if (!can(user, ["admin"])) return forbidden(res);
      return sendResult(res, await db.deleteProduct(id, user));
    }

    if (req.method === "POST" && resource === "contacts") {
      const body = bodyOf(req);
      if (body.type === "supplier" && !can(user, ["admin", "manager"])) return forbidden(res);
      return sendResult(res, await db.createContact(body, user));
    }

    if (req.method === "PUT" && resource === "contacts" && id) {
      const body = bodyOf(req);
      if (body.type === "supplier" && !can(user, ["admin", "manager"])) return forbidden(res);
      return sendResult(res, await db.updateContact(id, body, user));
    }

    if (req.method === "POST" && resource === "sales") {
      return sendResult(res, await db.createSale(bodyOf(req), user));
    }

    if (req.method === "POST" && resource === "orders") {
      return sendResult(res, await db.createOrder(bodyOf(req), user));
    }

    if (req.method === "POST" && resource === "purchases") {
      if (!can(user, ["admin", "manager"])) return forbidden(res);
      return sendResult(res, await db.createPurchase(bodyOf(req), user));
    }

    if (req.method === "POST" && resource === "refunds") {
      return sendResult(res, await db.createRefund(bodyOf(req), user));
    }

    if (req.method === "PUT" && resource === "settings") {
      if (!can(user, ["admin"])) return forbidden(res);
      return sendResult(res, await db.updateSettings(bodyOf(req), user));
    }

    if (req.method === "POST" && resource === "users") {
      if (!can(user, ["admin"])) return forbidden(res);
      return sendResult(res, await db.createUser(bodyOf(req), user));
    }

    if (req.method === "PUT" && resource === "users" && id) {
      if (!can(user, ["admin"])) return forbidden(res);
      return sendResult(res, await db.updateUser(id, bodyOf(req), user));
    }

    return res.status(404).json({ error: "API route not found." });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error." });
  }
};
