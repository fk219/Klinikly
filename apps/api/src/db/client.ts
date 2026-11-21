import mongoose from 'mongoose';
import { env } from '../config.js';

export const connectDb = async () => {
  await mongoose.connect(env.MONGODB_URI);
};

