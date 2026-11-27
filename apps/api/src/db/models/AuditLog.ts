import mongoose, { Schema } from 'mongoose';

export type AuditAction =
  | 'appointment.booked'
  | 'appointment.cancelled'
  | 'appointment.completed';

export type AuditLogDoc = {
  _id: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: ['appointment.booked', 'appointment.cancelled', 'appointment.completed']
    },
    entityType: { type: String, required: true, default: 'appointment' },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

auditLogSchema.index({ hospitalId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLogModel =
  mongoose.models.AuditLog ?? mongoose.model<AuditLogDoc>('AuditLog', auditLogSchema);
