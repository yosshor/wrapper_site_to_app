/**
 * @fileoverview Main server file for Mobile App Generator Backend
 * @author YosShor
 * @version 1.0.0
 *
 * Express server setup with middleware, routes, and database connection.
 * Includes security, logging, rate limiting, and error handling.
 */

import express, {
  Application,
  Request,
  Response,
  NextFunction,
  Router,
} from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";

// Import routes
import authRouter from "./routes/auth";
import appsRouter from "./routes/apps";
import buildsRouter from "./routes/builds";
import dashboardRouter from "./routes/dashboard";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

// Import services
import { FirebaseService } from "./services/FirebaseService";
import { RedisService } from "./services/RedisService";

// Load environment variables
dotenv.config();

/**
 * Main Application Class
 *
 * Sets up and configures the Express application with all necessary middleware,
 * routes, and database connections.
 */
class App {
  public app: Application;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;

    // Setup middleware
    this.initializeMiddleware();

    // Setup routes
    this.initializeRoutes();

    // Setup error handling
    this.initializeErrorHandling();
  }

  /**
   * Initialize the application
   */
  public async initialize(): Promise<void> {
    // Initialize services
    await this.initializeServices();

    // Connect to database
    await this.connectToDatabase();
  }

  /**
   * Initialize external services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize Firebase Admin SDK
      await FirebaseService.initialize();
      console.log("✅ Firebase Admin SDK initialized");

      // Initialize Redis connection
      await RedisService.connect();
      console.log("✅ Redis connection established");
    } catch (error) {
      console.error("❌ Failed to initialize services:", error);
      process.exit(1);
    }
  }

  /**
   * Setup application middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            connectSrc: ["'self'", "https:"],
          },
        },
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin:
          process.env.FRONTEND_URL ||
          "http://localhost:3000" ||
          "http://localhost:3001",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: "Too many requests from this IP, please try again later.",
      },
    });
    this.app.use("/api", limiter);

    // Compression middleware
    this.app.use(compression());

    // Request logging
    this.app.use(
      morgan("combined", {
        stream: {
          write: (message: string) => {
            console.log(message.trim());
          },
        },
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Static file serving for downloads
    this.app.use(
      "/api/downloads",
      express.static(path.join(process.cwd(), "..", "public", "downloads"), {
        setHeaders: (res, path) => {
          const fileName = path.split("/")[0].split("\\").pop();
          console.log("path", path, fileName);
          if (path.endsWith(".apk")) {
            res.setHeader(
              "Content-Type",
              "application/vnd.android.package-archive"
            );
            res.setHeader(
              "Content-Disposition",
              'attachment; filename="' + "android_" + fileName + '"'
            );
          } else if (path.endsWith(".ipa")) {
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader(
              "Content-Disposition",
              'attachment; filename="' + "ios_" + fileName + '"'
            );
          }
        },
      })
    );

    // Request logging middleware
    this.app.use(requestLogger);
  }

  /**
   * Setup application routes
   */
  private initializeRoutes(): void {
    // // API routes with /api prefix
    const apiRouter = Router();

    // Mount other API routes
    apiRouter.use("/auth", authRouter);
    apiRouter.use("/apps", appsRouter);
    // apiRouter.use('/builds', buildsRouter);
    apiRouter.use("/dashboard", dashboardRouter);

    // // Mount all API routes under /api
    this.app.use("/api", apiRouter);

    // Also mount routes without /api prefix for flexibility
    this.app.use("/health", (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: "Mobile App Generator API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      });
    });

    this.app.use("/builds", buildsRouter);

    // 404 handler for undefined routes
    this.app.all("*", (req: Request, res: Response) => {
      console.log("404 Not Found:", req.method, req.originalUrl);
      res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`,
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Connect to MongoDB database
   */
  private async connectToDatabase(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI!;

      if (!mongoUri) {
        throw new Error("MONGODB_URI environment variable is not set");
      }

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log("✅ Connected to MongoDB");

      // Handle MongoDB connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected");
      });
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  /**
   * Start the server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`📱 Mobile App Generator API v1.0.0`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📊 Health check: http://localhost:${this.port}/health`);
    });
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  }
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("👋 SIGINT received, shutting down gracefully");
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

// Create and start the application
const app = new App();

// Initialize services and database, then start listening
app
  .initialize()
  .then(() => {
    app.listen();
  })
  .catch((error) => {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  });

export default app;
