import mongoose, { Schema } from 'mongoose';

export type HospitalDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  status: 'active' | 'pending' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
};

const hospitalSchema = new Schema<HospitalDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['active', 'pending', 'disabled'], default: 'pending' }
  },
  { timestamps: true }
);

hospitalSchema.index({ slug: 1 }, { unique: true });
hospitalSchema.index({ name: 'text', slug: 'text' });

export const HospitalModel =
  mongoose.models.Hospital ?? mongoose.model<HospitalDoc>('Hospital', hospitalSchema);

