import { useEffect, useState, type FC } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Star, DollarSign, Clock } from 'lucide-react';
import { isApiError } from '@app/shared';
import { apiListDoctors, apiCreateDoctor, apiUpdateDoctor, type DoctorInput, type AdminDoctor } from '../api/doctors';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const loadDoctors = async () => {
  const res = await apiListDoctors();
  return isApiError(res) ? null : res.data.items;
};

const EMPTY_FORM: DoctorInput = {
  name: '', specialty: '', bio: '', education: '', experience: undefined, consultationFee: 0, avatarUrl: '',
};

export const DoctorsPage: FC = () => {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminDoctor | null>(null);
  const [form, setForm] = useState<DoctorInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    void loadDoctors().then((items) => {
      if (!active) return;
      if (items) setDoctors(items);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const load = async () => {
    setLoading(true);
    const items = await loadDoctors();
    if (items) setDoctors(items);
    setLoading(false);
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit = (d: AdminDoctor) => {
    setEditing(d);
    setForm({ name: d.name, specialty: d.specialty, bio: d.bio, education: d.education ?? '', experience: d.experience ?? undefined, consultationFee: d.consultationFee, avatarUrl: d.avatarUrl ?? '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, experience: form.experience ? Number(form.experience) : undefined, consultationFee: Number(form.consultationFee) };
    const res = editing ? await apiUpdateDoctor(editing.id, payload) : await apiCreateDoctor(payload);
    setSaving(false);
    if (isApiError(res)) { setError(res.error.message); return; }
    setShowModal(false);
    void load();
  };

  const toggleActive = async (d: AdminDoctor) => {
    await apiUpdateDoctor(d.id, { active: !d.active });
    void load();
  };

  const field = (label: string, key: keyof DoctorInput, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type} required={required}
        value={(form[key] as string | number | undefined) ?? ''}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500 mt-0.5">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} in your hospital</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Doctor
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-500 mb-4">No doctors yet. Add your first doctor to get started.</p>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> Add Doctor</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 p-5">
                {d.avatarUrl ? (
                  <img src={d.avatarUrl} alt={d.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-teal-500">{d.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{d.name}</h3>
                    <Badge variant={d.active ? 'green' : 'gray'}>{d.active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-sm text-teal-600 font-medium mt-0.5">{d.specialty}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {d.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400 fill-current" />{d.rating}</span>}
                    {d.experience && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{d.experience}y</span>}
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${d.consultationFee}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{d.bio}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={() => openEdit(d)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void toggleActive(d)}>
                  {d.active ? <ToggleRight className="h-4 w-4 mr-1 text-green-500" /> : <ToggleLeft className="h-4 w-4 mr-1 text-gray-400" />}
                  {d.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Doctor' : 'Add Doctor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('Full Name', 'name', 'text', true)}
            {field('Specialty', 'specialty', 'text', true)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio <span className="text-red-500">*</span></label>
            <textarea required rows={3} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Education', 'education')}
            {field('Experience (years)', 'experience', 'number')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Consultation Fee ($)', 'consultationFee', 'number', true)}
            {field('Avatar URL', 'avatarUrl')}
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Create Doctor'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );

  function handleSubmit(e: React.FormEvent) { void handleSave(e); }
};
