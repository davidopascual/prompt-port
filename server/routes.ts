import type { Express } from "express";
import { createServer, type Server } from "http";

// NOTE: API routes moved to server/index.ts for better organization and security
// This file now only creates and returns the HTTP server

export async function registerRoutes(app: Express): Promise<Server> {
  // Just return the HTTP server without registering routes
  // All API routes are now handled in server/index.ts
  const httpServer = createServer(app);
  return httpServer;
}
