# Klinikly Architecture

## System shape

```
Patient web (Vite/React)          Hospital portal (Vite/React)
        |                                    |
        |  Bearer access token               |
        |  httpOnly refresh cookie           |
        +----------------+-------------------+
                         |
                    Express API
          |              |               |
       auth           booking          admin
          |              |               |
          +--------------+---------------+
                         |
                      MongoDB
   users, refresh tokens, hospitals, hospital admins,
   doctors, availability rules, slots, appointments,
   audit logs
```

Both frontends are separate static builds. They call one API. The API owns every rule that matters: role checks, hospital scoping, slot generation, booking, cancellation, completion, and audit.

## Core decisions

### A slot is a claimable row

Availability is generated ahead of time from a weekly `AvailabilityRule`. Booking does not create a slot; it atomically changes an existing slot from `available` to `booked` with a conditional `findOneAndUpdate`.

### The database is the final guard

The appointment collection has a unique partial index on `(doctorId, slotStartAt)` for appointments with status `scheduled`. Even if application code races, MongoDB rejects a second scheduled appointment for the same doctor/time.

### Tenant isolation is enforced twice

The admin middleware verifies the JWT, checks the `hospital_admin` role, and resolves the administrator's `HospitalAdmin` mapping. Every admin query and write includes that `hospitalId`. Cross-hospital reads and writes are covered by tests.

### Refresh tokens rotate

Refresh tokens are random, sent as an httpOnly cookie, stored as SHA-256 hashes, revoked atomically on refresh, and rejected on reuse.

### Audit is scoped and append-only

Booking, cancellation, and completion append an `AuditLog` entry carrying hospital, actor, action, entity, and safe metadata. Hospital admins can read only their own hospital's audit trail. Audit writes are best-effort; failures are logged with the entity id for repair.

## Data model

| Collection | Purpose | Key indexes |
|---|---|---|
| `users` | Patients and hospital administrators | email unique, role |
| `refreshtokens` | Rotating refresh sessions | token hash unique, user + expiry |
| `hospitals` | Tenant boundary | slug unique |
| `hospitaladmins` | User-to-hospital mapping | user unique, hospital |
| `doctors` | Hospital-scoped specialists | hospital + active |
| `availabilityrules` | Weekly schedule windows | doctor + weekday |
| `availabilityslots` | Concrete claimable times | doctor + start unique |
| `appointments` | Booked visits | hospital, patient, doctor + start, partial unique scheduled |
| `auditlogs` | Append-only admin/patient actions | hospital + created, entity + created |

## Booking sequence

1. Authenticate the patient and validate the request.
2. Resolve the active doctor.
3. Atomically claim the slot (`available → booked`).
4. Create the scheduled appointment.
5. If appointment creation fails, release the slot.
6. Append the audit entry.
7. Return the appointment.

## What is intentionally not here

- Payments and insurance.
- Real email/SMS delivery. The audit log is the current source of operational truth.
- Calendar sync.
- Multi-region deployment.

These are documented limits, not hidden omissions.
