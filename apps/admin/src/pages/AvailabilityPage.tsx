import { useEffect, useState, type FC } from 'react';
import { isApiError } from '@app/shared';
import { Settings, Zap, Plus, Ban, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiListDoctors, type AdminDoctor } from '../api/doctors';
import {
  apiUpsertRule, apiGenerateSlots, apiListSlots, apiAddSlot, apiBlockSlot, apiDeleteSlot,
  type AvailabilityRule, type WeeklyTemplate, type SlotItem,
} from '../api/availability';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

const emptyRule = (): Omit<AvailabilityRule, 'id' | 'doctorId'> => ({
  timezone: 'UTC',
  slotDurationMinutes: 30,
  weeklyTemplate: { mon: [{ start: '09:00', end: '17:00' }], tue: [{ start: '09:00', end: '17:00' }], wed: [{ start: '09:00', end: '17:00' }], thu: [{ start: '09:00', end: '17:00' }], fri: [{ start: '09:00', end: '17:00' }] },
});

export const AvailabilityPage: FC = () => {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<AdminDoctor | null>(null);
  const [rule, setRule] = useState<Omit<AvailabilityRule, 'id' | 'doctorId'>>(emptyRule());
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genFrom, setGenFrom] = useState('');
  const [genTo, setGenTo] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  useEffect(() => {
    void apiListDoctors().then(res => { if (!isApiError(res)) setDoctors(res.data.items); });
  }, []);

  const loadSlots = async (doctorId: string, date: string) => {
    const from = `${date}T00:00:00.000Z`;
    const to = `${date}T23:59:59.999Z`;
    const res = await apiListSlots(doctorId, from, to);
    if (!isApiError(res)) setSlots(res.data.items);
  };

  const selectDoctor = (d: AdminDoctor) => {
    setSelectedDoctor(d);
    void loadSlots(d.id, viewDate);
  };

  const changeDate = (delta: number) => {
    const d = new Date(viewDate + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta);
    const next = d.toISOString().slice(0, 10);
    setViewDate(next);
    if (selectedDoctor) void loadSlots(selectedDoctor.id, next);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setSaving(true);
    await apiUpsertRule(selectedDoctor.id, rule);
    setSaving(false);
    setShowRuleModal(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    setGenerating(true);
    const res = await apiGenerateSlots(selectedDoctor.id, genFrom, genTo);
    setGenerating(false);
    if (!isApiError(res)) {
      setGenResult(`Generated/kept ${res.data.createdOrKept} slots`);
      void loadSlots(selectedDoctor.id, viewDate);
    }
  };

  const handleAddSlot = async () => {
    if (!selectedDoctor) return;
    const iso = `${viewDate}T${newSlotTime}:00.000Z`;
    await apiAddSlot(selectedDoctor.id, iso);
    void loadSlots(selectedDoctor.id, viewDate);
    setShowAddSlot(false);
  };

  const handleBlock = async (slot: SlotItem) => {
    if (!selectedDoctor) return;
    await apiBlockSlot(selectedDoctor.id, slot.startAt);
    void loadSlots(selectedDoctor.id, viewDate);
  };

  const handleDelete = async (slot: SlotItem) => {
    if (!selectedDoctor) return;
    await apiDeleteSlot(slot.id);
    void loadSlots(selectedDoctor.id, viewDate);
  };

  const slotBadge = (status: string) =>
    status === 'available' ? 'green' : status === 'booked' ? 'blue' : 'red';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const updateWindow = (day: string, idx: number, field: 'start' | 'end', val: string) => {
    setRule(prev => {
      const tpl = { ...prev.weeklyTemplate } as WeeklyTemplate;
      const windows = [...(tpl[day as keyof WeeklyTemplate] ?? [])];
      windows[idx] = { ...windows[idx], [field]: val };
      return { ...prev, weeklyTemplate: { ...tpl, [day]: windows } };
    });
  };

  const addWindow = (day: string) => {
    setRule(prev => {
      const tpl = { ...prev.weeklyTemplate } as WeeklyTemplate;
      const windows = [...(tpl[day as keyof WeeklyTemplate] ?? []), { start: '09:00', end: '17:00' }];
      return { ...prev, weeklyTemplate: { ...tpl, [day]: windows } };
    });
  };

  const removeWindow = (day: string, idx: number) => {
    setRule(prev => {
      const tpl = { ...prev.weeklyTemplate } as WeeklyTemplate;
      const windows = (tpl[day as keyof WeeklyTemplate] ?? []).filter((_, i) => i !== idx);
      return { ...prev, weeklyTemplate: { ...tpl, [day]: windows.length ? windows : undefined } };
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Availability Management</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Doctor list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm">Select Doctor</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {doctors.map(d => (
                <button key={d.id} onClick={() => selectDoctor(d)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedDoctor?.id === d.id ? 'bg-teal-50 border-l-2 border-teal-600' : ''}`}>
                  <p className="text-sm font-medium text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-teal-600">{d.specialty}</p>
                </button>
              ))}
              {doctors.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No doctors found</p>}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="lg:col-span-3 space-y-5">
          {!selectedDoctor ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-500">
              Select a doctor to manage their availability
            </div>
          ) : (
            <>
              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowRuleModal(true)}>
                  <Settings className="h-4 w-4 mr-1.5" /> Edit Weekly Schedule
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setGenResult(null); setShowGenModal(true); }}>
                  <Zap className="h-4 w-4 mr-1.5" /> Generate Slots
                </Button>
              </div>

              {/* Day view */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">
                      {new Date(viewDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                    </p>
                    <p className="text-xs text-gray-500">{slots.length} slot{slots.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => changeDate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex justify-end mb-4">
                    <Button size="sm" onClick={() => setShowAddSlot(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Add Slot
                    </Button>
                  </div>

                  {slots.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">No slots for this day. Generate slots or add manually.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {slots.map(slot => (
                        <div key={slot.id} className="border border-gray-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-900 mb-1.5">{formatTime(slot.startAt)}</p>
                          <Badge variant={slotBadge(slot.status) as 'green' | 'blue' | 'red'}>{slot.status}</Badge>
                          {slot.status !== 'booked' && (
                            <div className="flex gap-1.5 mt-2">
                              {slot.status === 'available' && (
                                <button onClick={() => void handleBlock(slot)} title="Block slot"
                                  className="p-1 text-gray-400 hover:text-amber-500 transition-colors">
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button onClick={() => void handleDelete(slot)} title="Delete slot"
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Weekly Rule Modal */}
      <Modal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)} title="Weekly Schedule" size="xl">
        <form onSubmit={e => void handleSaveRule(e)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <input value={rule.timezone} onChange={e => setRule(p => ({ ...p, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
              <input type="number" min={5} max={240} value={rule.slotDurationMinutes}
                onChange={e => setRule(p => ({ ...p, slotDurationMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {DAYS.map(day => {
              const windows = rule.weeklyTemplate[day] ?? [];
              return (
                <div key={day} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{DAY_LABELS[day]}</p>
                    <button type="button" onClick={() => addWindow(day)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium">+ Add window</button>
                  </div>
                  {windows.length === 0 ? (
                    <p className="text-xs text-gray-400">No working hours (day off)</p>
                  ) : (
                    windows.map((w, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5">
                        <input type="time" value={w.start} onChange={e => updateWindow(day, i, 'start', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        <span className="text-gray-400 text-sm">to</span>
                        <input type="time" value={w.end} onChange={e => updateWindow(day, i, 'end', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                        <button type="button" onClick={() => removeWindow(day, i)}
                          className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowRuleModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Generate Slots Modal */}
      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Generate Slots">
        <form onSubmit={e => void handleGenerate(e)} className="space-y-4">
          <p className="text-sm text-gray-600">Generate availability slots from the weekly schedule for a date range.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" required value={genFrom} onChange={e => setGenFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" required value={genTo} onChange={e => setGenTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          {genResult && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{genResult}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowGenModal(false)}>Close</Button>
            <Button type="submit" loading={generating}><Zap className="h-4 w-4 mr-1.5" /> Generate</Button>
          </div>
        </form>
      </Modal>

      {/* Add Slot Modal */}
      <Modal isOpen={showAddSlot} onClose={() => setShowAddSlot(false)} title="Add Manual Slot">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Add a single available slot on <strong>{viewDate}</strong> (UTC).</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time (UTC)</label>
            <input type="time" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddSlot(false)}>Cancel</Button>
            <Button onClick={() => void handleAddSlot()}>Add Slot</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
