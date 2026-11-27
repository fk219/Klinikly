import mongoose from 'mongoose';
import { AuditLogModel, type AuditAction } from '../db/models/AuditLog.js';

type AuditInput = {
  hospitalId: mongoose.Types.ObjectId;
  actorUserId: string;
  actorRole: string;
  action: AuditAction;
  entityId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
};

/**
 * Audit writes are best-effort so a transient audit failure cannot roll back
 * a confirmed appointment. Failures are logged with the entity id for repair.
 */
export async function recordAppointmentAudit(input: AuditInput): Promise<void> {
  try {
    await AuditLogModel.create({
      hospitalId: input.hospitalId,
      actorUserId: new mongoose.Types.ObjectId(input.actorUserId),
      actorRole: input.actorRole,
      action: input.action,
      entityType: 'appointment',
      entityId: input.entityId,
      metadata: input.metadata ?? {}
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'audit_write_failed',
        action: input.action,
        entityId: input.entityId.toString(),
        error: error instanceof Error ? error.message : String(error)
      })
    );
  }
}
