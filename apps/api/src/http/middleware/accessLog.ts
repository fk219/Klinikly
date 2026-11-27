import type { RequestHandler } from 'express';

export const accessLog = (): RequestHandler => (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();

  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    console.log(
      JSON.stringify({
        level: 'info',
        message: 'http_request',
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10
      })
    );
  });

  return next();
};
