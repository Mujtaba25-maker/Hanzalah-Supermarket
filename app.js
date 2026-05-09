require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const db = require("./lib/database");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DIST_DIR = path.join(ROOT, "dist");
const PUBLIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : path.join(ROOT, "public");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8"
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
  });
}

function sendServiceResult(res, result) {
  if (result.error) {
    sendError(res, result.status || 400, result.error);
    return;
  }
  sendJson(res, result.status || 200, result.data);
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/store") {
    sendJson(res, 200, await db.getStore());
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/products/barcode/")) {
    const barcode = decodeURIComponent(pathname.split("/").pop());
    const product = await db.findProductByBarcode(barcode);
    if (!product) return sendError(res, 404, "No product found for this barcode.");
    sendJson(res, 200, product);
    return;
  }

  if (req.method === "POST" && pathname === "/api/products") {
    sendServiceResult(res, await db.createProduct(await readBody(req)));
    return;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/products/")) {
    sendServiceResult(res, await db.updateProduct(pathname.split("/").pop(), await readBody(req)));
    return;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/products/")) {
    sendServiceResult(res, await db.deleteProduct(pathname.split("/").pop()));
    return;
  }

  if (req.method === "POST" && pathname === "/api/contacts") {
    sendServiceResult(res, await db.createContact(await readBody(req)));
    return;
  }

  if (req.method === "POST" && pathname === "/api/sales") {
    sendServiceResult(res, await db.createSale(await readBody(req)));
    return;
  }

  if (req.method === "POST" && pathname === "/api/orders") {
    sendServiceResult(res, await db.createOrder(await readBody(req)));
    return;
  }

  if (req.method === "POST" && pathname === "/api/purchases") {
    sendServiceResult(res, await db.createPurchase(await readBody(req)));
    return;
  }

  sendError(res, 404, "API route not found.");
}

function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendError(res, 403, "Forbidden.");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      const isAppRoute = !path.extname(filePath);
      const indexPath = path.join(PUBLIC_DIR, "index.html");
      if (isAppRoute && fs.existsSync(indexPath)) {
        fs.readFile(indexPath, (indexError, indexContent) => {
          if (indexError) {
            sendError(res, 404, "File not found.");
            return;
          }
          res.writeHead(200, { "Content-Type": contentTypes[".html"] });
          res.end(indexContent);
        });
        return;
      }
      sendError(res, 404, "File not found.");
      return;
    }
    const type = contentTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url.pathname);
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (error) {
    sendError(res, 500, error.message || "Server error.");
  }
});

server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close the other server or start this app with another port, for example: $env:PORT=3001; npm start`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`Hanzalah Supermarket running at http://localhost:${PORT}`);
});
