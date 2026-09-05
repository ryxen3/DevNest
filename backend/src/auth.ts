import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export const ok = (res: Response, data: unknown, message?: string) =>
  res.json({ success: true, data, ...(message ? { message } : {}) });
export const fail = (
  res: Response,
  statusCode: number,
  message: string,
  errors: string[] = [],
) =>
  res.status(statusCode).json({ success: false, statusCode, message, errors });
export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (token) {
    try {
      req.user = jwt.verify(
        token,
        process.env.JWT_SECRET || "devnest-local-secret",
      ) as { id: number; email: string };
    } catch {}
  }
  next();
};
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) return fail(res, 401, "Authentication is required");
  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "devnest-local-secret",
    ) as { id: number; email: string };
    next();
  } catch {
    return fail(res, 401, "Invalid or expired access token");
  }
};
