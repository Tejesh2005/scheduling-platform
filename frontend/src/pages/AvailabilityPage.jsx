import { useEffect, useState } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
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
    const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${min}${h < 12 ? 'am' : 'pm'}`;
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
  const [copySourceDay, setCopySourceDay] = useState(null);
  const [copyTargets, setCopyTargets] = useState({});

  useEffect(() => {
    fetchSchedules();
  }, []);

  const makeTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const sortedSlots = [...(activeSchedule?.slots || [])].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  const fetchSchedules = async () => {
    try {
      const res = await availabilityAPI.getAll();
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

  const toggleDay = (dayOfWeek, enabled) => {
    setActiveSchedule((prev) => {
      const hasDaySlot = prev.slots.some((s) => s.day_of_week === dayOfWeek);

      if (enabled && !hasDaySlot) {
        return {
          ...prev,
          slots: [
            ...prev.slots,
            {
              id: makeTempId(),
              day_of_week: dayOfWeek,
              start_time: '09:00',
              end_time: '17:00',
              is_enabled: true,
            },
          ],
        };
      }

      return {
        ...prev,
        slots: prev.slots.map((s) =>
          s.day_of_week === dayOfWeek ? { ...s, is_enabled: enabled } : s
        ),
      };
    });
  };

  const addSlotForDay = (dayOfWeek) => {
    setActiveSchedule((prev) => {
      const daySlots = [...prev.slots]
        .filter((s) => s.day_of_week === dayOfWeek)
        .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

      const last = daySlots[daySlots.length - 1];
      const defaultStart = last?.end_time?.substring(0, 5) || '09:00';
      const startIdx = TIME_OPTIONS.findIndex((t) => t.value === defaultStart);
      const endIdx = startIdx >= 0 ? Math.min(startIdx + 4, TIME_OPTIONS.length - 1) : 4;
      const defaultEnd = TIME_OPTIONS[endIdx]?.value || '10:00';

      return {
        ...prev,
        slots: [
          ...prev.slots,
          {
            id: makeTempId(),
            day_of_week: dayOfWeek,
            start_time: defaultStart,
            end_time: defaultEnd > defaultStart ? defaultEnd : '23:45',
            is_enabled: true,
          },
        ],
      };
    });
  };

  const removeSlot = (slotId) => {
    setActiveSchedule((prev) => {
      const slotToRemove = prev.slots.find((s) => s.id === slotId);
      if (!slotToRemove) return prev;

      const sameDaySlots = prev.slots.filter(
        (s) => s.day_of_week === slotToRemove.day_of_week
      );

      if (sameDaySlots.length <= 1) {
        return {
          ...prev,
          slots: prev.slots.map((s) =>
            s.id === slotId ? { ...s, is_enabled: false } : s
          ),
        };
      }

      return {
        ...prev,
        slots: prev.slots.filter((s) => s.id !== slotId),
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizedSlots = activeSchedule.slots.map((slot) => {
        const normalized = {
          day_of_week: slot.day_of_week,
          start_time: slot.start_time?.substring(0, 5),
          end_time: slot.end_time?.substring(0, 5),
          is_enabled: !!slot.is_enabled,
        };

        if (slot.id && !String(slot.id).startsWith('temp-')) {
          normalized.id = slot.id;
        }

        return normalized;
      });

      await availabilityAPI.update(activeSchedule.id, {
        name: activeSchedule.name,
        timezone: activeSchedule.timezone,
        slots: normalizedSlots,
      });

      await fetchSchedules();
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
      await fetchSchedules();
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
      await fetchSchedules();
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
    setCopySourceDay(slot.day_of_week);
    setCopyTargets(initialTargets);
  };

  const closeCopyPopover = () => {
    setCopySourceSlotId(null);
    setCopySourceDay(null);
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
    if (copySourceDay === null) return;

    const sourceDaySlots = [...activeSchedule.slots]
      .filter((slot) => slot.day_of_week === copySourceDay && slot.is_enabled)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    if (sourceDaySlots.length === 0) {
      closeCopyPopover();
      return;
    }

    setActiveSchedule((prev) => ({
      ...prev,
      slots: [
        ...prev.slots.filter((slot) => {
          if (!copyTargets[slot.day_of_week]) return true;
          if (slot.day_of_week === copySourceDay) return true;
          return false;
        }),
        ...DAYS.flatMap((_, dayIdx) => {
          if (!copyTargets[dayIdx] || dayIdx === copySourceDay) return [];
          return sourceDaySlots.map((slot) => ({
            id: makeTempId(),
            day_of_week: dayIdx,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_enabled: true,
          }));
        }),
      ],
    }));

    closeCopyPopover();
  };

  const getScheduleSummary = () => {
    if (!activeSchedule) return '';

    const enabledDays = [...new Set(
      activeSchedule.slots
        .filter((s) => s.is_enabled)
        .map((s) => DAYS[s.day_of_week].substring(0, 3))
    )];

    if (enabledDays.length === 0) return 'No availability set';

    const firstSlot = activeSchedule.slots.find((s) => s.is_enabled);
    if (!firstSlot) return '';

    const startLabel =
      TIME_OPTIONS.find((t) => t.value === firstSlot.start_time?.substring(0, 5))?.label ||
      firstSlot.start_time?.substring(0, 5);
    const endLabel =
      TIME_OPTIONS.find((t) => t.value === firstSlot.end_time?.substring(0, 5))?.label ||
      firstSlot.end_time?.substring(0, 5);

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{activeSchedule.name}</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1">{getScheduleSummary()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-visible">
            <div className="divide-y divide-[#1a1a1a]">
              {DAYS.map((dayName, dayIdx) => {
                const daySlots = sortedSlots.filter((slot) => slot.day_of_week === dayIdx);
                const firstSlot = daySlots[0];
                const isDayEnabled = daySlots.some((slot) => slot.is_enabled);

                return (
                  <div key={dayName} className="px-4 sm:px-5 py-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                      <div className="flex items-center gap-3 min-w-[170px]">
                      <Toggle
                        enabled={isDayEnabled}
                        onChange={(val) => toggleDay(dayIdx, val)}
                      />
                      <span className={`text-sm font-medium ${isDayEnabled ? 'text-white' : 'text-gray-500'}`}>
                        {dayName}
                      </span>
                      </div>

                      {isDayEnabled && firstSlot ? (
                      <div className="ml-11 sm:ml-0 mt-0.5 sm:mt-0 space-y-2 min-w-0">
                        {daySlots.filter((slot) => slot.is_enabled).map((slot, rowIdx) => (
                          <div
                            key={slot.id || `${slot.day_of_week}-${slot.start_time}-${slot.end_time}-${rowIdx}`}
                            className="flex flex-wrap sm:flex-nowrap items-center gap-2"
                          >
                            <select
                              value={slot.start_time?.substring(0, 5)}
                              onChange={(e) => handleSlotChange(slot.id, 'start_time', e.target.value)}
                              className="rounded-md border border-[#333333] bg-[#1a1a1a] px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-[110px] sm:w-[100px]"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>

                            <span className="text-gray-500 text-sm">-</span>

                            <select
                              value={slot.end_time?.substring(0, 5)}
                              onChange={(e) => handleSlotChange(slot.id, 'end_time', e.target.value)}
                              className="rounded-md border border-[#333333] bg-[#1a1a1a] px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-[110px] sm:w-[100px]"
                            >
                              {TIME_OPTIONS.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </select>

                            {rowIdx === 0 ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => addSlotForDay(dayIdx)}
                                  className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copySourceSlotId === slot.id ? closeCopyPopover() : openCopyPopover(slot)
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
                                    <div className="absolute left-0 sm:left-auto sm:right-0 top-12 z-40 w-[calc(100vw-2rem)] max-w-[280px] rounded-2xl border border-[#252525] bg-[#070809] shadow-[0_18px_40px_rgba(0,0,0,0.55)] overflow-hidden">
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
                                        {DAYS.map((day, targetDayIdx) => (
                                          <label key={day} className="flex items-center gap-3 py-1.5 text-base text-white cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={!!copyTargets[targetDayIdx]}
                                              onChange={() => toggleCopyTarget(targetDayIdx)}
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
                              <span className="w-[61px]" aria-hidden="true" />
                            )}

                            {rowIdx > 0 ? (
                              <button
                                type="button"
                                onClick={() => removeSlot(slot.id)}
                                className="p-1.5 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="w-7" aria-hidden="true" />
                            )}
                          </div>
                        ))}
                      </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-lg mt-6">
            <div className="px-4 sm:px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Date overrides</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add dates when your availability changes from your daily hours.
                  </p>
                </div>
              </div>

              {activeSchedule.overrides && activeSchedule.overrides.length > 0 ? (
                <div className="mt-4 divide-y divide-[#1a1a1a]">
                  {activeSchedule.overrides.map((override) => (
                    <div key={override.id} className="flex items-center justify-between py-2.5">
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

        <div className="lg:w-[320px]">
          <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
            <Select
              options={TIMEZONE_OPTIONS}
              value={activeSchedule.timezone}
              onChange={(e) => setActiveSchedule((prev) => ({ ...prev, timezone: e.target.value }))}
            />
          </div>
        </div>
      </div>

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
              onChange={(val) => setOverrideForm((prev) => ({ ...prev, is_available: val }))}
              label="Available"
            />
          </div>

          {overrideForm.is_available && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Start Time"
                options={TIME_OPTIONS}
                value={overrideForm.start_time}
                onChange={(e) => setOverrideForm((prev) => ({ ...prev, start_time: e.target.value }))}
              />
              <Select
                label="End Time"
                options={TIME_OPTIONS}
                value={overrideForm.end_time}
                onChange={(e) => setOverrideForm((prev) => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#222222]">
            <Button variant="secondary" onClick={() => setShowOverrideModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOverride}>Add Override</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
