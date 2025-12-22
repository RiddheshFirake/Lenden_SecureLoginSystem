import { Request, Response, NextFunction } from 'express';

export interface SecurityEvent {
  type: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'REGISTRATION' | 'RATE_LIMIT' | 'TOKEN_VALIDATION' | 'PROFILE_ACCESS';
  userId?: string;
  email?: string;
  ip: string;
  userAgent?: string;
  timestamp: string;
  details?: any;
}

/**
 * Security event logger
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  private events: SecurityEvent[] = [];

  private constructor() {}

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log a security event
   */
  public logEvent(event: SecurityEvent): void {
    // In production, this would write to a proper logging service
    console.log('SECURITY_EVENT:', JSON.stringify(event, null, 2));
    
    // Store in memory for testing (in production, use proper storage)
    this.events.push(event);
    
    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * Get recent security events (for testing)
   */
  public getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear events (for testing)
   */
  public clearEvents(): void {
    this.events = [];
  }
}

/**
 * Middleware to log security-related requests
 */
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const logger = SecurityLogger.getInstance();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function(body: any) {
    const statusCode = res.statusCode;
    const isAuthEndpoint = req.path.startsWith('/api/auth/');
    const isProfileEndpoint = req.path.startsWith('/api/profile');

    // Log security events based on endpoint and status code
    if (isAuthEndpoint || isProfileEndpoint) {
      const baseEvent = {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      };

      if (req.path === '/api/auth/register' && statusCode === 201) {
        logger.logEvent({
          ...baseEvent,
          type: 'REGISTRATION',
          email: req.body?.email,
          details: { success: true }
        });
      } else if (req.path === '/api/auth/login') {
        if (statusCode === 200) {
          logger.logEvent({
            ...baseEvent,
            type: 'AUTH_SUCCESS',
            email: req.body?.email,
            details: { success: true }
          });
        } else if (statusCode === 401) {
          logger.logEvent({
            ...baseEvent,
            type: 'AUTH_FAILURE',
            email: req.body?.email,
            details: { reason: 'invalid_credentials' }
          });
        }
      } else if (req.path === '/api/auth/validate') {
        if (statusCode === 200) {
          logger.logEvent({
            ...baseEvent,
            type: 'TOKEN_VALIDATION',
            userId: req.user?.userId,
            email: req.user?.email,
            details: { success: true }
          });
        } else if (statusCode === 401) {
          logger.logEvent({
            ...baseEvent,
            type: 'TOKEN_VALIDATION',
            details: { success: false, reason: 'invalid_token' }
          });
        }
      } else if (isProfileEndpoint) {
        if (statusCode === 200) {
          logger.logEvent({
            ...baseEvent,
            type: 'PROFILE_ACCESS',
            userId: req.user?.userId,
            email: req.user?.email,
            details: { success: true }
          });
        } else if (statusCode === 401) {
          logger.logEvent({
            ...baseEvent,
            type: 'PROFILE_ACCESS',
            details: { success: false, reason: 'unauthorized' }
          });
        }
      }

      // Log rate limiting events
      if (statusCode === 429) {
        logger.logEvent({
          ...baseEvent,
          type: 'RATE_LIMIT',
          email: req.body?.email,
          details: { endpoint: req.path }
        });
      }
    }

    return originalSend.call(this, body);
  };

  next();
};

// Export singleton logger instance
export const securityLogger = SecurityLogger.getInstance();