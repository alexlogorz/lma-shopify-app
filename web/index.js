// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import studentRoutes from "./routes/students.js";
import courseRoutes from "./routes/courses.js";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import bodyParser from "body-parser";
import { verifyProxyRequest } from "./utils.js";
import dotenv from 'dotenv';
import cors from "cors";
import fs from "fs";
import https from "https";

dotenv.config();

const allowedOrigins = ["https://latinmixacademy.com"];
const isProduction = process.env.NODE_ENV === "production";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/lma-shopify-app/web/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

let server;

if (isProduction) {
    // Load SSL certificate and private key
    const options = {
        key: fs.readFileSync(`${process.env.SSL_KEY_PATH}`),
        cert: fs.readFileSync(`${process.env.SSL_CERT_PATH}`),
    };

    server = https.createServer(options, app);
} 
else {
    server = app;
}

console.log(isProduction)

// CORS
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));


// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

// Requests coming from the shopify admin
app.use("/api/*", shopify.validateAuthenticatedSession());

// Requests coming from the app proxy.
app.use("/proxy/*", verifyProxyRequest);

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

// Routers
app.use("/api/students", studentRoutes); 
app.use("/api/courses", courseRoutes);

// Proxy routes
app.use("/proxy/students", studentRoutes);


app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

server.listen(PORT);
