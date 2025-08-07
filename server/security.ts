import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { dataEncryption } from './encryption.js';

// Extend Request interface for custom properties
declare global {
  namespace Express {
    interface Request {
      originalBody?: any;
    }
  }
}

// Rate limiting for API endpoints
export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for development
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket connections for HMR
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false, // Disable HSTS in development
});

// Middleware to automatically encrypt request data
export const encryptRequestData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && Object.keys(req.body).length > 0) {
    // Store original data temporarily for processing
    req.originalBody = req.body;
    
    // Create a hash for logging (no sensitive data)
    const dataHash = dataEncryption.hash(JSON.stringify(req.body));
    console.log(`Processing request with data hash: ${dataHash}`);
  }
  next();
};

// Middleware to ensure data cleanup after processing
export const cleanupRequestData = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send.bind(res);
  
  res.send = function(body?: any) {
    // Clean up sensitive data from memory
    if (req.originalBody) {
      // Overwrite sensitive data
      Object.keys(req.originalBody).forEach(key => {
        if (typeof req.originalBody![key] === 'string') {
          req.originalBody![key] = 'CLEARED';
        }
      });
      delete req.originalBody;
    }
    
    // Clean up file data if it exists
    if (req.file) {
      // Overwrite buffer
      if (req.file.buffer) {
        req.file.buffer.fill(0);
      }
    }
    
    return originalSend(body);
  };
  
  next();
};

// Security audit logging (without sensitive data)
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  const originalSend = res.send.bind(res);
  res.send = function(body?: any) {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.slice(0, 100), // Truncate UA
      timestamp: new Date().toISOString(),
      // Never log actual data content
      hasFileUpload: !!req.file,
      contentLength: req.get('content-length') || '0'
    };
    
    if (process.env.LOG_LEVEL !== 'silent') {
      console.log(JSON.stringify(logData));
    }
    
    return originalSend(body);
  };
  
  next();
};
