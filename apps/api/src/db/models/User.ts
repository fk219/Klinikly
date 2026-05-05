import mongoose, { Schema } from 'mongoose';

export type UserRole = 'patient' | 'hospital_admin' | 'platform_admin';

export type UserDoc = {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: false, trim: true },
    role: { type: String, required: true, enum: ['patient', 'hospital_admin', 'platform_admin'] }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = mongoose.models.User ?? mongoose.model<UserDoc>('User', userSchema);

