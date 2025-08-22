import { Request, Response, NextFunction, RequestHandler } from "express";

const catchAsync =
  <T extends RequestHandler>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default catchAsync;
