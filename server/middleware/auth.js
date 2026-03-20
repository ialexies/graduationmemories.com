import jwt from 'jsonwebtoken';
import { canEditPage } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requirePageAccess(pageIdParam = 'id') {
  return (req, res, next) => {
    const pageId = req.params[pageIdParam];
    if (!pageId) return res.status(400).json({ error: 'Page ID required' });
    const allowed = canEditPage(req.user.id, req.user.role, pageId);
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied to this page' });
    }
    next();
  };
}
