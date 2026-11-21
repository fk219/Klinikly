import { createApp } from './app.js';
import { env } from './config.js';
import { connectDb } from './db/client.js';

const main = async () => {
  await connectDb();

  const app = createApp();

  app.listen(env.PORT, () => {
    process.stdout.write(`API listening on :${env.PORT}\n`);
  });
};

main().catch((err) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
