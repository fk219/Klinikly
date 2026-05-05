import mongoose, { Schema } from 'mongoose';

export type WeeklyWindow = {
  start: string;
  end: string;
};

export type WeeklyTemplate = Partial<
  Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', WeeklyWindow[]>
>;

export type AvailabilityRuleDoc = {
  _id: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  timezone: string;
  slotDurationMinutes: number;
  weeklyTemplate: WeeklyTemplate;
  createdAt: Date;
  updatedAt: Date;
};

const weeklyWindowSchema = new Schema<WeeklyWindow>(
  {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  { _id: false }
);

const availabilityRuleSchema = new Schema<AvailabilityRuleDoc>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    timezone: { type: String, required: true, default: 'UTC' },
    slotDurationMinutes: { type: Number, required: true, min: 5, default: 30 },
    weeklyTemplate: {
      mon: { type: [weeklyWindowSchema], required: false, default: undefined },
      tue: { type: [weeklyWindowSchema], required: false, default: undefined },
      wed: { type: [weeklyWindowSchema], required: false, default: undefined },
      thu: { type: [weeklyWindowSchema], required: false, default: undefined },
      fri: { type: [weeklyWindowSchema], required: false, default: undefined },
      sat: { type: [weeklyWindowSchema], required: false, default: undefined },
      sun: { type: [weeklyWindowSchema], required: false, default: undefined }
    }
  },
  { timestamps: true }
);

availabilityRuleSchema.index({ doctorId: 1 }, { unique: true });

export const AvailabilityRuleModel =
  mongoose.models.AvailabilityRule ??
  mongoose.model<AvailabilityRuleDoc>('AvailabilityRule', availabilityRuleSchema);
