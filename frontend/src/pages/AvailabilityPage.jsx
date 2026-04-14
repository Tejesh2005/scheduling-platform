import { useState, useEffect } from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react';
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
    const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${min} ${h < 12 ? 'AM' : 'PM'}`;
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
  { value: 'Asia/Kolkata', label: 'India (IST)' },
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded" />
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure times when you are available for bookings.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Schedule info */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={activeSchedule.name}
                onChange={(e) =>
                  setActiveSchedule((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-sm font-semibold text-gray-900 border-none focus:outline-none focus:ring-0 bg-transparent"
              />
            </div>
            <Select
              options={TIMEZONE_OPTIONS}
              value={activeSchedule.timezone}
              onChange={(e) =>
                setActiveSchedule((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className="w-72"
            />
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="divide-y divide-gray-100">
          {activeSchedule.slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-4 px-6 py-3.5"
            >
              <div className="w-8">
                <Toggle
                  enabled={slot.is_enabled}
                  onChange={(val) => handleSlotChange(slot.id, 'is_enabled', val)}
                />
              </div>

              <span
                className={`w-28 text-sm font-medium ${
                  slot.is_enabled ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {DAYS[slot.day_of_week]}
              </span>

              {slot.is_enabled ? (
                <div className="flex items-center gap-2">
                  <select
                    value={slot.start_time?.substring(0, 5)}
                    onChange={(e) =>
                      handleSlotChange(slot.id, 'start_time', e.target.value)
                    }
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <span className="text-gray-400 text-sm">-</span>

                  <select
                    value={slot.end_time?.substring(0, 5)}
                    onChange={(e) =>
                      handleSlotChange(slot.id, 'end_time', e.target.value)
                    }
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Date Overrides */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Date Overrides
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add dates when your availability changes from your weekly hours.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowOverrideModal(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Override
          </Button>
        </div>

        {activeSchedule.overrides && activeSchedule.overrides.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activeSchedule.overrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(override.override_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-sm text-gray-500 ml-3">
                    {override.is_available
                      ? `${override.start_time?.substring(0, 5)} - ${override.end_time?.substring(0, 5)}`
                      : 'Unavailable'}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteOverride(override.id)}
                  className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No date overrides set.</p>
          </div>
        )}
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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