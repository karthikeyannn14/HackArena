import { Request, Response, NextFunction } from 'express';

// Import the existing Member 1 JWT authentication middleware
// @ts-ignore
import authenticate = require('../../../backend-platform/backend/src/middleware/auth.middleware');

export const jwtActorBridge = [
  // 1. First, strip any client-provided x-actor-id to prevent spoofing
  (req: Request, res: Response, next: NextFunction) => {
    delete req.headers['x-actor-id'];
    next();
  },
  
  // 2. Execute existing Member 1 JWT verification
  // This will securely verify the token, return 401 if invalid, 
  // and attach `req.user = { userId, role }` if valid.
  authenticate,
  
  // 3. Extract the canonical userId and inject it as x-actor-id
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (user && user.userId) {
      req.headers['x-actor-id'] = user.userId;
    }
    
    next();
  }
];
