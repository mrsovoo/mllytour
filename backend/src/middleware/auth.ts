import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/security.js";
import { errorResponse } from "../utils/response.js";

export interface AuthUser {
  id: string;
  role: "CUSTOMER" | "PARTNER" | "ADMIN" | "SUPER_ADMIN";
  email?: string;
}

export interface AdminUserSession {
  id: string;
  username: string;
  role: "ADMIN" | "SUPER_ADMIN";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      admin?: AdminUserSession;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token =
    req.cookies?.millytour_session ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.substring(7)
      : undefined);

  if (token) {
    const payload = verifyToken<AuthUser>(token);
    if (payload) {
      req.user = payload;
    }
  }

  const adminToken = req.cookies?.millytour_admin_session;
  if (adminToken) {
    const payload = verifyToken<AdminUserSession>(adminToken);
    if (payload) {
      req.admin = payload;
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return errorResponse(res, "Autentifikatsiyadan o'tilmagan", "UNAUTHORIZED", 401);
  }
  next();
}

export function requirePartner(req: Request, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== "PARTNER" && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    return errorResponse(res, "Hamkor huquqi talab etiladi", "FORBIDDEN", 403);
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.admin && (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN"))) {
    return errorResponse(res, "Administrator huquqi talab etiladi", "FORBIDDEN", 403);
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const isAdmin = req.admin?.role === "SUPER_ADMIN" || req.user?.role === "SUPER_ADMIN";
  if (!isAdmin) {
    return errorResponse(res, "Super Administrator huquqi talab etiladi", "FORBIDDEN", 403);
  }
  next();
}
