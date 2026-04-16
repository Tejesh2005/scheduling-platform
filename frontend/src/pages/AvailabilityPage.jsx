import { useState, useEffect } from 'react';
import { Plus, Clock, Trash2, ArrowLeft, Copy } from 'lucide-react';
import { availabilityAPI } from '../api';
import Button from '../components/UI/Button';
import Select from '../components/UI/Select';
import Toggle from '../components/UI/Toggle';
import Modal from '../components/UI/Modal';
import Input from '../components/UI/Input';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hour = String(h).padStart(2, '0');
    const min = String(m).padStart(2, '0');
    const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${min.padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
    TIME_OPTIONS.push({ value: `${hour}:${min}`, label });
  }
}

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export default function AvailabilityPage() {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    override_date: '',
    is_available: false,
    start_time: '09:00',
    end_time: '17:00',
  });
  const [copySourceSlotId, setCopySourceSlotId] = useState(null);
  const [copyTargets, setCopyTargets] = useState({});

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await availabilityAPI.getAll();
      setSchedules(res.data.data);
      if (res.data.data.length > 0) {
        setActiveSchedule(res.data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (slotId, field, value) => {
    setActiveSchedule((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await availabilityAPI.update(activeSchedule.id, {
        name: activeSchedule.name,
        timezone: activeSchedule.timezone,
        slots: activeSchedule.slots,
      });
      alert('Availability saved successfully!');
    } catch (err) {
      console.error('Error saving availability:', err);
      alert('Error saving availability');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOverride = async () => {
    try {
      await availabilityAPI.addOverride(activeSchedule.id, overrideForm);
      setShowOverrideModal(false);
      fetchSchedules();
      setOverrideForm({
        override_date: '',
        is_available: false,
        start_time: '09:00',
        end_time: '17:00',
      });
    } catch (err) {
      console.error('Error adding override:', err);
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    try {
      await availabilityAPI.deleteOverride(activeSchedule.id, overrideId);
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting override:', err);
    }
  };

  const openCopyPopover = (slot) => {
    const initialTargets = DAYS.reduce((acc, _, dayIdx) => {
      acc[dayIdx] = dayIdx === slot.day_of_week;
      return acc;
    }, {});

    setCopySourceSlotId(slot.id);
    setCopyTargets(initialTargets);
  };

  const closeCopyPopover = () => {
    setCopySourceSlotId(null);
    setCopyTargets({});
  };

  const toggleCopyTarget = (dayIdx) => {
    setCopyTargets((prev) => ({
      ...prev,
      [dayIdx]: !prev[dayIdx],
    }));
  };

  const toggleSelectAllCopyTargets = (checked) => {
    const allTargets = DAYS.reduce((acc, _, dayIdx) => {
      acc[dayIdx] = checked;
      return acc;
    }, {});
    setCopyTargets(allTargets);
  };

  const applyCopyTimes = () => {
    if (!copySourceSlotId) return;

    const sourceSlot = activeSchedule.slots.find((slot) => slot.id === copySourceSlotId);
    if (!sourceSlot) {
      closeCopyPopover();
      return;
    }

    setActiveSchedule((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) => {
        if (!copyTargets[slot.day_of_week]) {
          return slot;
        }

        return {
          ...slot,
          is_enabled: true,
          start_time: sourceSlot.start_time,
          end_time: sourceSlot.end_time,
        };
      }),
    }));

    closeCopyPopover();
  };

  // Get schedule summary text
  const getScheduleSummary = () => {
    if (!activeSchedule) return '';
    const enabledDays = activeSchedule.slots
      .filter((s) => s.is_enabled)
      .map((s) => DAYS[s.day_of_week].substring(0, 3));
    
    if (enabledDays.length === 0) return 'No availability set';
    
    const firstSlot = activeSchedule.slots.find((s) => s.is_enabled);
    if (!firstSlot) return '';

    const startLabel = TIME_OPTIONS.find((t) => t.value === firstSlot.start_time?.substring(0, 5))?.label || firstSlot.start_time?.substring(0, 5);
    const endLabel = TIME_OPTIONS.find((t) => t.value === firstSlot.end_time?.substring(0, 5))?.label || firstSlot.end_time?.substring(0, 5);

    return `${enabledDays[0]} - ${enabledDays[enabledDays.length - 1]}, ${startLabel} - ${endLabel}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[#1a1a1a] rounded w-48" />
        <div className="h-64 bg-[#1a1a1a] rounded" />
      </div>
    );
  }

  if (!activeSchedule) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No availability schedule found.</p>
      </div>
    );
  }

  const allDaysSelected = DAYS.every((_, dayIdx) => copyTargets[dayIdx]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {activeSchedule.name}
              </h1>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {getScheduleSummary()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="secondary" size="sm" className="text-red-400 hover:text-red-300">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left - Schedule */}
        <div className="flex-1">
          {/* Weekly Schedule */}
          <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-visible">
            <div className="divide-y divide-[#1a1a1a]">
              {activeSchedule.slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <Toggle
                      enabled={slot.is_enabled}
                      onChange={(val) => handleSlotChange(slot.id, 'is_enabled', val)}
                    />
                    <span
                      className={`text-sm font-medium ${
                        slot.is_enabled ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {DAYS[slot.day_of_week]}
                    </span>
                  </div>

                  {slot.is_enabled ? (
                    <div className="flex items-center gap-2 ml-11 sm:ml-0">
                      <select
                        value={slot.start_time?.substring(0, 5)}
                        onChange={(e) =>
                          handleSlotChange(slot.id, 'start_time', e.target.value)
                        }
                        className="rounded-md border border-[#333333] bg-[#1a1a1a] px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-[100px]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-gray-500 text-sm">-</span>

                      <select
                        value={slot.end_time?.substring(0, 5)}
                        onChange={(e) =>
                          handleSlotChange(slot.id, 'end_time', e.target.value)
                        }
                        className="rounded-md border border-[#333333] bg-[#1a1a1a] px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-[100px]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      <button className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            copySourceSlotId === slot.id
                              ? closeCopyPopover()
                              : openCopyPopover(slot)
                          }
                          className={`p-1.5 rounded-md transition-colors ${
                            copySourceSlotId === slot.id
                              ? 'bg-[#1a1a1a] text-white ring-2 ring-[#5a95ff]'
                              : 'text-gray-500 hover:bg-[#1a1a1a] hover:text-white'
                          }`}
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {copySourceSlotId === slot.id && (
                          <div className="absolute left-0 sm:left-auto sm:right-0 top-12 z-40 w-[280px] rounded-2xl border border-[#252525] bg-[#070809] shadow-[0_18px_40px_rgba(0,0,0,0.55)] overflow-hidden">
                            <div className="px-5 pt-5 pb-3">
                              <p className="text-[12px] tracking-wide uppercase text-[#9ca3af] mb-2.5 font-semibold">
                                Copy times to
                              </p>

                              <label className="flex items-center gap-3 py-1.5 text-sm text-white cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={allDaysSelected}
                                  onChange={(e) => toggleSelectAllCopyTargets(e.target.checked)}
                                  className="h-[18px] w-[18px] rounded-[4px] border border-[#4b5563] bg-transparent accent-blue-500"
                                />
                                <span className="text-sm leading-none">Select all</span>
                              </label>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto px-5 pb-3 space-y-0.5">
                              {DAYS.map((day, dayIdx) => (
                                <label
                                  key={day}
                                  className="flex items-center gap-3 py-1.5 text-base text-white cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!copyTargets[dayIdx]}
                                    onChange={() => toggleCopyTarget(dayIdx)}
                                    className="h-[18px] w-[18px] rounded-[4px] border border-[#4b5563] bg-transparent accent-blue-500"
                                  />
                                  {day}
                                </label>
                              ))}
                            </div>

                            <div className="px-4 py-3 border-t border-[#242424] bg-[#070809] flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={closeCopyPopover}
                                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-md hover:bg-[#111214]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={applyCopyTimes}
                                className="px-4 py-1.5 text-sm font-semibold rounded-xl bg-white text-[#0a0a0a] hover:bg-gray-200"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600 ml-11 sm:ml-0"></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Date Overrides */}
          <div className="bg-[#111111] border border-[#222222] rounded-lg mt-6">
            <div className="px-4 sm:px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Date overrides
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add dates when your availability changes from your daily hours.
                  </p>
                </div>
              </div>

              {activeSchedule.overrides && activeSchedule.overrides.length > 0 ? (
                <div className="mt-4 divide-y divide-[#1a1a1a]">
                  {activeSchedule.overrides.map((override) => (
                    <div
                      key={override.id}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="text-sm font-medium text-white">
                          {new Date(override.override_date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-sm text-gray-500">
                          {override.is_available
                            ? `${override.start_time?.substring(0, 5)} - ${override.end_time?.substring(0, 5)}`
                            : 'Unavailable'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteOverride(override.id)}
                        className="p-1.5 rounded-md hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={() => setShowOverrideModal(true)}
                className="mt-3 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors border border-[#282828] rounded-md px-3 py-1.5 hover:bg-[#1a1a1a]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add an override
              </button>
            </div>
          </div>
        </div>

        {/* Right - Timezone */}
        <div className="lg:w-[320px]">
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timezone
            </label>
            <Select
              options={TIMEZONE_OPTIONS}
              value={activeSchedule.timezone}
              onChange={(e) =>
                setActiveSchedule((prev) => ({ ...prev, timezone: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Override Modal */}
      <Modal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title="Add Date Override"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={overrideForm.override_date}
            onChange={(e) =>
              setOverrideForm((prev) => ({ ...prev, override_date: e.target.value }))
            }
          />

          <div className="flex items-center gap-3">
            <Toggle
              enabled={overrideForm.is_available}
              onChange={(val) =>
                setOverrideForm((prev) => ({ ...prev, is_available: val }))
              }
              label="Available"
            />
          </div>

          {overrideForm.is_available && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Start Time"
                options={TIME_OPTIONS}
                value={overrideForm.start_time}
                onChange={(e) =>
                  setOverrideForm((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
              />
              <Select
                label="End Time"
                options={TIME_OPTIONS}
                value={overrideForm.end_time}
                onChange={(e) =>
                  setOverrideForm((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                  }))
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#222222]">
            <Button
              variant="secondary"
              onClick={() => setShowOverrideModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddOverride}>Add Override</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}