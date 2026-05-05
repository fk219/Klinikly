import mongoose, { Schema } from 'mongoose';

export type DoctorDoc = {
  _id: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  name: string;
  specialty: string;
  bio: string;
  education?: string;
  experience?: number;
  consultationFee: number;
  rating?: number;
  avatarUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const doctorSchema = new Schema<DoctorDoc>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    bio: { type: String, required: true, trim: true },
    education: { type: String, required: false, trim: true },
    experience: { type: Number, required: false, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    rating: { type: Number, required: false, min: 0, max: 5 },
    avatarUrl: { type: String, required: false, trim: true },
    active: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

doctorSchema.index({ name: 'text', specialty: 'text' });
doctorSchema.index({ hospitalId: 1, specialty: 1 });

export const DoctorModel = mongoose.models.Doctor ?? mongoose.model<DoctorDoc>('Doctor', doctorSchema);
