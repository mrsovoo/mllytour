declare module "express" {
  const express: any;
  export default express;
  export type Request = any;
  export type Response = any;
  export type NextFunction = any;
  export type Router = any;
  export const Router: any;
}

declare module "cors" {
  const cors: any;
  export default cors;
}

declare module "cookie-parser" {
  const cookieParser: any;
  export default cookieParser;
}

declare module "@prisma/client" {
  export const PrismaClient: any;
  export type PrismaClient = any;
}
