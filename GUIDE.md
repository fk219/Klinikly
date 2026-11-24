# Klinikly — Guide

## What it is

Klinikly is a multi-tenant hospital appointment platform. Patients compare specialists, see real generated availability, and claim a slot. Each hospital gets its own scoped admin workspace.

- **Patient site:** https://klinikly.furqankhan.dev
- **Hospital portal:** https://klinikly-admin.furqankhan.dev
- **API:** https://klinikly-api.onrender.com

## Patient flow

1. Open the patient site.
2. Use **Find a doctor** or pick a specialist from **Next available**.
3. Choose a doctor and a date.
4. Choose an open time.
5. Sign in or create a patient account.
6. Add a short reason for the visit.
7. Confirm the appointment.

The slot is claimed at the database level. Two patients cannot take the same slot. The confirmation dialog links to **My appointments**, where a visit can be cancelled. Cancelling returns the slot to the hospital schedule.

### Demo patient

Use the **Enter as demo patient** button on the sign-in page, or:

- **Email:** `patient@klinikly.example`
- **Password:** `Patient123!`

The account opens the patient dashboard with live appointment actions. No signup is required. Do not enter real medical information.

## Hospital portal

Two seeded hospital administrators are available. Use the **Enter** buttons on the hospital sign-in page, or:

- **City Care Hospital:** `admin@city-care-hospital.example.com` / `Admin123!`
- **Green Valley Clinic:** `admin@green-valley-clinic.example.com` / `Admin123!`

Each administrator only sees their own hospital's doctors, availability, and appointments.

From the portal you can:

- View hospital-level counts and upcoming appointments.
- Browse the hospital's doctors.
- Edit a doctor's weekly schedule.
- Generate bookable slots.
- Search appointments and update their status.

## What is real

- Doctors, hospitals, weekly rules, and slots are stored in MongoDB Atlas.
- Availability comes from generated hospital schedules.
- Booking is atomic and scoped to one hospital.
- Cancellation releases the slot.
- CORS is restricted to the live patient and admin origins.

## Tech

React, TypeScript, Vite, Tailwind CSS, Express, MongoDB Atlas, JWT access and refresh tokens.

## Honest limits

- This is a demo healthcare product, not a clinical system.
- No payments, prescriptions, medical records, or real patient data.
- The free Render API can cold-start after inactivity.
