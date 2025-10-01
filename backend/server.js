const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
require("dotenv").config();

// Create Express app
const app = express();

// MIDDLEWARE ORDER: Security -> CORS -> Body Parser -> Data Sanitization -> Routes

// 1. Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Adjust based on your needs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || '*']
    }
  },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: 'deny' }
}));

// 2. Compression for all responses
app.use(compression());

// 3. MongoDB query sanitization against NoSQL injection - AFTER body parsing
// Skip sanitization for OPTIONS requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // Only sanitize the body if it exists
  if (req.body) {
    // Simple sanitization function to replace $ and . characters in keys
    const sanitizeObj = (obj) => {
      const result = {};
      Object.keys(obj).forEach(key => {
        // Replace MongoDB operators with safe alternatives
        const sanitizedKey = key.replace(/[$\.]/g, '_');
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          result[sanitizedKey] = sanitizeObj(obj[key]);
        } else {
          result[sanitizedKey] = obj[key];
        }
      });
      return result;
    };
    
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObj(req.body);
    }
  }
  
  next();
});

// Rate limiting to prevent brute-force attacks
const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes by default
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to authentication routes
app.use('/api/voters/login', apiLimiter);
app.use('/api/voters/register', apiLimiter);

// Basic middleware - ORDER MATTERS FOR MIDDLEWARE!
// 1. First parse the body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        // Split multiple URLs from environment variable
        ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : []),
        // Default production domains
        'http://localhost:5173',
        'http://localhost:5174'
      ]
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS for all requests
app.use(cors(corsOptions));

// Log requests in development mode
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
    next();
  });
}

// Import API routes
const voterRoutes = require("./routes/voterRoutes");
const electionRoutes = require("./routes/electionRoutes");
const votingRoutes = require("./routes/votingRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const webauthnRoutes = require("./routes/webauthnRoutes");
const syncRoutes = require("./routes/syncRoutes");

// Apply API routes
app.use("/api/voters", voterRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/voting", votingRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/webauthn", webauthnRoutes);

// Sync routes for real-time updates (separate path to avoid ID conflicts)
app.use("/api/sync", syncRoutes);

// Health check endpoint (useful for deployment platforms)
app.get('/health', (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(status);
});

// Catch-all route for frontend if you're hosting frontend and backend together
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the frontend build directory
  // Uncomment and adjust path as needed for your project structure
  // app.use(express.static(path.join(__dirname, '../build')));
  
  // All unhandled requests should return the React app
  // app.get('*', (req, res) => {
  //   res.sendFile(path.join(__dirname, '../build', 'index.html'));
  // });
}

// Add proper handler for preflight requests to avoid 404 errors
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(204).send();
  }
  next();
});

// 404 handler - must be after all routes
app.use((req, res, next) => {
  res.status(404).json({ 
    message: 'Not Found - The requested resource does not exist',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log the error with request details for proper debugging
  console.error(`[${new Date().toISOString()}] Error processing ${req.method} ${req.path}:`, {
    error: err.message,
    stack: err.stack,
    user: req.user ? req.user.id : 'unauthenticated',
    body: process.env.NODE_ENV !== 'production' ? req.body : '[redacted]',
    params: req.params,
    query: req.query
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      status: 'error',
      statusCode: 400,
      details: process.env.NODE_ENV === 'production' ? 'Invalid input data' : err.message
    });
  }
  
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate Key Error',
      status: 'error',
      statusCode: 409,
      details: process.env.NODE_ENV === 'production' ? 'Resource already exists' : err.message
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Authentication Error',
      status: 'error',
      statusCode: 401,
      details: process.env.NODE_ENV === 'production' ? 'Invalid token' : err.message
    });
  }
  
  // Default error response
  const errorResponse = {
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred while processing your request' 
      : err.message,
    status: 'error',
    statusCode: err.status || 500,
    requestId: req.id || Date.now().toString() // For tracking in logs
  };
  
  // Include stack trace only in development
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorResponse.stack = err.stack;
  }
  
  res.status(errorResponse.statusCode).json(errorResponse);
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// Production-ready MongoDB connection with retry logic
console.log("Attempting to connect to MongoDB Atlas...");

// Enhanced connection options - removed deprecated options
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,  // Timeout for server selection
  socketTimeoutMS: 45000,           // Socket timeout
  autoIndex: true,                 // Build indexes
  maxPoolSize: 10,                 // Maintain up to 10 socket connections
  family: 4                        // Use IPv4, skip trying IPv6
};

// Connection with retry logic
const connectWithRetry = async (retries = 5, interval = 5000) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    
    // Log connection string (but hide password)
    const sanitizedUri = process.env.MONGO_URI 
      ? process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@')
      : "No MONGO_URI provided in environment variables";
    console.error("Connection string being used:", sanitizedUri);
    
    // Check for common issues
    if (!process.env.MONGO_URI) {
      console.error("ERROR: Missing MONGO_URI in environment variables");
    } else if (process.env.MONGO_URI.includes("<password>") || process.env.MONGO_URI.includes("<username>")) {
      console.error("ERROR: Your MONGO_URI contains placeholders that need to be replaced with actual values");
    }
    
    // Retry logic
    if (retries > 0) {
      console.log(`Retrying connection in ${interval/1000} seconds... (${retries} attempts remaining)`);
      setTimeout(() => connectWithRetry(retries - 1, interval), interval);
    } else {
      console.error("Maximum connection attempts reached. Check your MongoDB configuration.");
      
      // In production, you might want to exit the process here
      // In development, we'll continue running to allow using mock data
      if (process.env.NODE_ENV === 'production') {
        console.error("Exiting application due to database connection failure");
        process.exit(1); 
      } else {
        console.warn("Running in development mode without database. Some features may not work.");
      }
    }
  }
};

// Initialize connection
connectWithRetry();

// Configure application for production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app if you're hosting frontend and backend together
  // Uncomment if you're building frontend to backend/public or similar
  // app.use(express.static(path.join(__dirname, 'public')));
  
  // For security in production
  app.use((req, res, next) => {
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-Content-Type-Options', 'nosniff');
    next();
  });
}

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`));

// Graceful shutdown handler
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/**
 * Graceful shutdown function to close connections properly
 */
function gracefulShutdown() {
  console.log('🛑 Received shutdown signal, closing connections...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(false)
      .then(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      });
  });
  
  // Force shutdown after 10 seconds if connections haven't closed
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}
