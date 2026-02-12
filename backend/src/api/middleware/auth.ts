import { Request, Response, NextFunction } from 'express'

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  next()
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    next()
  }
}
