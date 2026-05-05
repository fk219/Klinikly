import { connectDb } from '../db/client';
import { seed } from './seed';

const main = async () => {
  await connectDb();
  const result = await seed();
  process.stdout.write(JSON.stringify({ data: result }, null, 2) + '\n');
};

main().catch((err) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});

