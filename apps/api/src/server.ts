import { createApp } from './app';
import { env } from './config';
import { connectDb } from './db/client';

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
