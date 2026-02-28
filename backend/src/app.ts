import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import fileRoutes from "./routes/file.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import stripeRoutes from "./routes/webhook.routes.js";
import orderRoutes from "./routes/order.routes.js";
import userRoutes from "./routes/user.routes.js";
import logger from "./utils/logger.js";
import morgan from "morgan";
import { globalErrorHandler } from "./middlewares/errorHandler.js";
import { httpRequestCounter, httpRequestDuration, register } from "./utils/metrics.js";

const app = express();
app.use("/api/stripe", stripeRoutes);
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(hpp());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = process.hrtime();
  res.on("finish", () => {
    console.log("FINISHED:", req.method, req.originalUrl)

    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    httpRequestCounter.inc({
      method: req.method,
      route: req.baseUrl || req.path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.baseUrl || req.path,
        status: res.statusCode,
      },
      duration,
    );
  });
  next();
});

app.use(
  morgan(
    (tokens, req, res) => {
      const responseTime = Number(tokens["response-time"](req, res));
      if (responseTime >= 500) {
        logger.warn("Slow API Detected", {
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: Number(tokens.status(req, res)),
          responseTime,
          ip: tokens["remote-addr"](req, res),
          userAgent: tokens["user-agent"](req, res),
        });
      }
      return JSON.stringify({
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: Number(tokens.status(req, res)),
        contentLength: tokens.res(req, res, "content-length"),
        responseTime: Number(tokens["response-time"](req, res)),
        ip: tokens["remote-addr"](req, res),
        userAgent: tokens["user-agent"](req, res),
      });
    },
    {
      stream: {
        write: (message) => logger.info(JSON.parse(message)),
      },
    },
  ),
);
// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/file", fileRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/user", userRoutes);
app.get("/metrics",async(req:Request,res:Response)=>{
  res.set("Content-Type",register.contentType)
  res.end(await register.metrics())
})

app.use(globalErrorHandler);

export default app;
