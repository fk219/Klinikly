import mongoose from 'mongoose';
import { connectDb } from '../db/client.js';
import { seed } from './seed.js';

const main = async () => {
  await connectDb();
  const result = await seed();
  process.stdout.write(JSON.stringify({ data: result }, null, 2) + '\n');
};

main()
  .catch((err) => {
    process.stderr.write(String(err) + '\n');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
