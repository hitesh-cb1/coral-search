// Centralized logging
export class Logger {
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${message}`, meta || '')
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || '')
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${message}`, meta || '')
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, meta || '')
    }
  }
}

export const logger = new Logger()
