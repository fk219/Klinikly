import mongoose, { Schema } from 'mongoose';

export type HospitalAdminDoc = {
  _id: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const hospitalAdminSchema = new Schema<HospitalAdminDoc>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: true }
);

hospitalAdminSchema.index({ hospitalId: 1 }, { unique: true });

export const HospitalAdminModel =
  mongoose.models.HospitalAdmin ?? mongoose.model<HospitalAdminDoc>('HospitalAdmin', hospitalAdminSchema);
