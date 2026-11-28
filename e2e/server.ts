import http from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const PORT = 3102;

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_ACCESS_SECRET = 'e2e-access-secret-32-characters';
  process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-32-characters';
  process.env.PORT = String(PORT);
  process.env.CORS_ORIGIN = 'http://localhost:5176';

  const { connectDb } = await import('../apps/api/src/db/client.js');
  await connectDb();

  const { seed } = await import('../apps/api/src/seed/seed.js');
  await seed();

  const { createApp } = await import('../apps/api/src/app.js');
  const server = http.createServer(createApp());

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`e2e api ready on http://127.0.0.1:${PORT}`);
  });
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
