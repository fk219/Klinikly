import { hashPassword } from '../auth/password';
import { HospitalModel } from '../db/models/Hospital';
import { HospitalAdminModel } from '../db/models/HospitalAdmin';
import { UserModel } from '../db/models/User';
import { DoctorModel } from '../db/models/Doctor';
import { AvailabilityRuleModel } from '../db/models/AvailabilityRule';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const seed = async () => {
  const hospitals = [
    { name: 'City Care Hospital' },
    { name: 'Green Valley Clinic' }
  ];

  const adminPassword = 'Admin123!';
  const adminPasswordHash = await hashPassword(adminPassword);

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

    const doctors = [
      {
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiology',
        bio: 'Cardiologist focused on preventive care and cardiac imaging.',
        education: 'MD, Harvard Medical School',
        experience: 15,
        consultationFee: 200,
        rating: 4.9,
        avatarUrl:
          'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
      },
      {
        name: 'Dr. Michael Chen',
        specialty: 'Neurology',
        bio: 'Neurologist specializing in epilepsy and movement disorders.',
        education: 'MD, Stanford University',
        experience: 12,
        consultationFee: 250,
        rating: 4.8,
        avatarUrl:
          'https://images.pexels.com/photos/6129967/pexels-photo-6129967.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
      }
    ];

    for (const d of doctors) {
      const doc = await DoctorModel.findOneAndUpdate(
        { hospitalId: hospital._id, name: d.name },
        { $set: { ...d, hospitalId: hospital._id, active: true } },
        { upsert: true, new: true }
      );

      await AvailabilityRuleModel.findOneAndUpdate(
        { doctorId: doc._id },
        {
          $setOnInsert: {
            hospitalId: hospital._id,
            doctorId: doc._id,
            timezone: 'UTC',
            slotDurationMinutes: 30,
            weeklyTemplate: {
              mon: [{ start: '09:00', end: '17:00' }],
              tue: [{ start: '09:00', end: '17:00' }],
              wed: [{ start: '09:00', end: '17:00' }],
              thu: [{ start: '09:00', end: '17:00' }],
              fri: [{ start: '09:00', end: '17:00' }]
            }
          }
        },
        { upsert: true, new: true }
      );
    }

    results.push({ hospitalSlug: slug, adminEmail, adminPassword });
  }

  return results;
};
