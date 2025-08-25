import express from "express";
import cors from "cors";
import routes from "./routes";
import ErrorMiddleware from "./middlewares/error.middleware";
// import { ENV } from "./config/env";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    // origin: "*", // frontend URL
    credentials: true, // allow cookies
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// API routes
app.use("/api", routes);

// Error handler
app.use(ErrorMiddleware);

// Start server
// app.listen(ENV.PORT, () => {
//   console.log(` Server running at http://localhost:${ENV.PORT}`);
// });

export default app;
