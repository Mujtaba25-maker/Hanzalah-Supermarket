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

module.exports = async function handler(req, res) {
  try {
    const parts = Array.isArray(req.query.path) ? req.query.path : [];
    const [resource, id, extra] = parts;

    if (req.method === "GET" && resource === "store") {
      return res.status(200).json(await db.getStore());
    }

    if (req.method === "GET" && resource === "products" && id === "barcode" && extra) {
      const product = await db.findProductByBarcode(decodeURIComponent(extra));
      if (!product) return res.status(404).json({ error: "No product found for this barcode." });
      return res.status(200).json(product);
    }

    if (req.method === "POST" && resource === "products" && !id) {
      return sendResult(res, await db.createProduct(bodyOf(req)));
    }

    if (req.method === "PUT" && resource === "products" && id) {
      return sendResult(res, await db.updateProduct(id, bodyOf(req)));
    }

    if (req.method === "DELETE" && resource === "products" && id) {
      return sendResult(res, await db.deleteProduct(id));
    }

    if (req.method === "POST" && resource === "contacts") {
      return sendResult(res, await db.createContact(bodyOf(req)));
    }

    if (req.method === "POST" && resource === "sales") {
      return sendResult(res, await db.createSale(bodyOf(req)));
    }

    if (req.method === "POST" && resource === "orders") {
      return sendResult(res, await db.createOrder(bodyOf(req)));
    }

    if (req.method === "POST" && resource === "purchases") {
      return sendResult(res, await db.createPurchase(bodyOf(req)));
    }

    return res.status(404).json({ error: "API route not found." });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Server error." });
  }
};
