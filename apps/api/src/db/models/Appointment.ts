import mongoose, { Schema } from 'mongoose';

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed';

export type AppointmentDoc = {
  _id: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  patientUserId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  slotStartAt: Date;
  reason: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
};

const appointmentSchema = new Schema<AppointmentDoc>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    patientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    slotStartAt: { type: Date, required: true, index: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['scheduled', 'cancelled', 'completed'] }
  },
  { timestamps: true }
);

appointmentSchema.index({ patientUserId: 1, slotStartAt: -1 });
appointmentSchema.index({ doctorId: 1, slotStartAt: -1 });

export const AppointmentModel =
  mongoose.models.Appointment ?? mongoose.model<AppointmentDoc>('Appointment', appointmentSchema);

