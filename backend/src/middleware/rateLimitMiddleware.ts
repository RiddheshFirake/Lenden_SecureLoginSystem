import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimitMiddleware {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 100, windowMs: number = 15 * 60 * 1000) { // 100 attempts per 15 minutes for development
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    // Only apply rate limiting to auth endpoints
    if (!req.path.startsWith('/api/auth/')) {
      return next();
    }

    const clientId = this.getClientId(req);
    const now = Date.now();
    const entry = this.attempts.get(clientId);

    // If no entry exists or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.attempts.set(clientId, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return next();
    }

    // If within rate limit, increment and continue
    if (entry.count < this.maxAttempts) {
      entry.count++;
      return next();
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    });
  };

  private getClientId(req: Request): string {
    // Use IP address as client identifier
    // In production, you might want to use a more sophisticated approach
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [clientId, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(clientId);
      }
    }
  }

  public reset(clientId?: string): void {
    if (clientId) {
      this.attempts.delete(clientId);
    } else {
      this.attempts.clear();
    }
  }

  public getAttemptCount(clientId: string): number {
    const entry = this.attempts.get(clientId);
    return entry ? entry.count : 0;
  }
}

// Export singleton instance
export const rateLimitMiddleware = new RateLimitMiddleware().middleware;