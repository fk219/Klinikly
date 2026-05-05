import mongoose from 'mongoose';
import { env } from '../config';

export const connectDb = async () => {
  await mongoose.connect(env.MONGODB_URI);
};

