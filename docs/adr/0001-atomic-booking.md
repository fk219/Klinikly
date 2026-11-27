# ADR 0001: Atomic slot booking

## Context

Two patients can request the same doctor and time at the same moment. The platform must allow exactly one confirmed appointment and must not double-book a specialist.

## Decision

1. Availability is materialized as `AvailabilitySlot` rows.
2. Booking claims a slot with a conditional update:
   `findOneAndUpdate({ status: 'available' }, { status: 'booked' })`.
3. `Appointment` has a unique partial index on `(doctorId, slotStartAt)` for `scheduled` appointments.
4. If appointment creation fails, the slot is released back to `available`.
5. Cancellation marks the appointment `cancelled` and releases the slot.

## Consequences

- The database is the final arbiter, not application memory.
- The API can safely run multiple instances.
- A failed appointment insert has a compensating slot release; a future outbox/transaction can make this fully atomic across both collections.
- The concurrency test fires 100 requests for one slot and asserts one `200`, ninety-nine `409`, one appointment, and one booked slot.

## Alternatives considered

- Check-then-write in application code: rejected, races.
- Transaction-only booking: rejected for the current standalone test environment; unique index provides the guarantee without requiring a replica set.
- Queue-based serialization: unnecessary complexity for this scale.
