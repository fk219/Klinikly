import { hashPassword } from '../auth/password.js';
import { HospitalModel } from '../db/models/Hospital.js';
import { HospitalAdminModel } from '../db/models/HospitalAdmin.js';
import { UserModel } from '../db/models/User.js';
import { DoctorModel } from '../db/models/Doctor.js';
import { AvailabilityRuleModel } from '../db/models/AvailabilityRule.js';
import { AvailabilitySlotModel } from '../db/models/AvailabilitySlot.js';
import { generateSlots } from '../availability/generateSlots.js';

const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type SeedDoctor = {
  name: string;
  specialty: string;
  bio: string;
  education: string;
  experience: number;
  consultationFee: number;
  rating: number;
  avatarUrl?: string;
};

const doctorSets: Record<string, SeedDoctor[]> = {
  'city-care-hospital': [
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      bio: 'Cardiologist focused on preventive care and cardiac imaging.',
      education: 'MD, Harvard Medical School',
      experience: 15,
      consultationFee: 200,
      rating: 4.9
    },
    {
      name: 'Dr. Michael Chen',
      specialty: 'Neurology',
      bio: 'Neurologist specializing in epilepsy and movement disorders.',
      education: 'MD, Stanford University',
      experience: 12,
      consultationFee: 250,
      rating: 4.8
    }
  ],
  'green-valley-clinic': [
    {
      name: 'Dr. Priya Nair',
      specialty: 'Dermatology',
      bio: 'Dermatologist focused on inflammatory skin conditions and pediatric care.',
      education: 'MD, AIIMS Delhi',
      experience: 9,
      consultationFee: 180,
      rating: 4.7
    },
    {
      name: 'Dr. Daniel Okafor',
      specialty: 'Orthopedics',
      bio: 'Orthopedic surgeon focused on sports injuries and joint replacement.',
      education: 'MD, Johns Hopkins University',
      experience: 14,
      consultationFee: 300,
      rating: 4.8
    }
  ]
};

// Generate slots for the next 30 days from today
const getDateRange = () => {
  const now = new Date();
  const from = now.toISOString().slice(0, 10);
  const toDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const to = toDate.toISOString().slice(0, 10);
  return { from, to };
};

export const seed = async () => {
  await DoctorModel.updateMany({}, { $unset: { avatarUrl: '' } });

  const hospitals = [
    { name: 'City Care Hospital' },
    { name: 'Green Valley Clinic' }
  ];

  const adminPassword = 'Admin123!';
  const adminPasswordHash = await hashPassword(adminPassword);

  const demoPatient = {
    email: 'patient@klinikly.example',
    password: 'Patient123!'
  };
  const demoPatientHash = await hashPassword(demoPatient.password);

  await UserModel.findOneAndUpdate(
    { email: demoPatient.email },
    {
      $set: {
        email: demoPatient.email,
        passwordHash: demoPatientHash,
        name: 'Demo Patient',
        phone: '+91 90000 00000',
        role: 'patient'
      }
    },
    { new: true, upsert: true }
  );

  const results: Array<{ hospitalSlug: string; adminEmail: string; adminPassword: string }> = [];

  for (const h of hospitals) {
    const slug = slugify(h.name);

    const hospital = await HospitalModel.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name: h.name, slug, status: 'active' } },
      { new: true, upsert: true }
    );

    const adminEmail = `admin@${slug}.example.com`;
    const user = await UserModel.findOneAndUpdate(
      { email: adminEmail },
      {
        $setOnInsert: {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          name: `${h.name} Admin`,
          role: 'hospital_admin'
        }
      },
      { new: true, upsert: true }
    );

    await HospitalAdminModel.findOneAndUpdate(
      { hospitalId: hospital._id },
      { $set: { hospitalId: hospital._id, userId: user._id } },
      { upsert: true, new: true }
    );

    const weeklyTemplate = {
      mon: [{ start: '09:00', end: '17:00' }],
      tue: [{ start: '09:00', end: '17:00' }],
      wed: [{ start: '09:00', end: '17:00' }],
      thu: [{ start: '09:00', end: '17:00' }],
      fri: [{ start: '09:00', end: '17:00' }]
    };

    const doctors = doctorSets[slug] ?? doctorSets['city-care-hospital'];

    const { from, to } = getDateRange();

    for (const d of doctors) {
      const doc = await DoctorModel.findOneAndUpdate(
        { hospitalId: hospital._id, name: d.name },
        { $set: { ...d, hospitalId: hospital._id, active: true } },
        { upsert: true, new: true }
      );

      const rule = await AvailabilityRuleModel.findOneAndUpdate(
        { doctorId: doc._id },
        {
          $setOnInsert: {
            hospitalId: hospital._id,
            doctorId: doc._id,
            timezone: 'UTC',
            slotDurationMinutes: 30,
            weeklyTemplate
          }
        },
        { upsert: true, new: true }
      );

      // Generate availability slots for the next 30 days
      const startAts = generateSlots({
        from,
        to,
        slotDurationMinutes: rule.slotDurationMinutes,
        weeklyTemplate: rule.weeklyTemplate
      });

      if (startAts.length > 0) {
        const ops = startAts.map((startAt) => ({
          updateOne: {
            filter: { doctorId: doc._id, startAt },
            update: {
              $setOnInsert: {
                hospitalId: hospital._id,
                doctorId: doc._id,
                startAt,
                status: 'available',
                source: 'generated'
              }
            },
            upsert: true
          }
        }));
        await AvailabilitySlotModel.bulkWrite(ops, { ordered: false });
      }
    }

    results.push({ hospitalSlug: slug, adminEmail, adminPassword });
  }

  return { admins: results, demoPatient };
};
