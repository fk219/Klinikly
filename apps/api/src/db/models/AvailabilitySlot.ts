import mongoose, { Schema } from 'mongoose';

export type AvailabilitySlotStatus = 'available' | 'booked' | 'blocked';
export type AvailabilitySlotSource = 'generated' | 'manual' | 'override';

export type AvailabilitySlotDoc = {
  _id: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  startAt: Date;
  status: AvailabilitySlotStatus;
  source: AvailabilitySlotSource;
  createdAt: Date;
  updatedAt: Date;
};

const availabilitySlotSchema = new Schema<AvailabilitySlotDoc>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    startAt: { type: Date, required: true, index: true },
    status: { type: String, required: true, enum: ['available', 'booked', 'blocked'] },
    source: { type: String, required: true, enum: ['generated', 'manual', 'override'] }
  },
  { timestamps: true }
);

availabilitySlotSchema.index(
  { doctorId: 1, startAt: 1 },
  {
    unique: true
  }
);

export const AvailabilitySlotModel =
  mongoose.models.AvailabilitySlot ??
  mongoose.model<AvailabilitySlotDoc>('AvailabilitySlot', availabilitySlotSchema);
