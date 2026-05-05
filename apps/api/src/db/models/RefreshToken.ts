import mongoose, { Schema } from 'mongoose';

export type RefreshTokenDoc = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, required: false }
  },
  { timestamps: true }
);

refreshTokenSchema.index({ userId: 1, tokenHash: 1 }, { unique: true });

export const RefreshTokenModel =
  mongoose.models.RefreshToken ?? mongoose.model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema);

