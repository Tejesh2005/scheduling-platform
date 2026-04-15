// FILE: src/components/Bookings/RescheduleModal.jsx

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { publicAPI } from '../../api';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function RescheduleModal({ isOpen, onClose, booking, onReschedule }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date());
      setSelectedDate(null);
      setSlots([]);
      setSelectedSlot(null);
    }
  }, [isOpen]);

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate && booking) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlots = async (date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      // We need username and slug — derive from booking
      // Since we're the admin, we know username is 'johndoe'
      // We need the slug from the event type
      const res = await publicAPI.getSlots('johndoe', booking.event_slug || booking.slug, dateStr);
      setSlots(res.data.data);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !selectedDate) return;
    setSubmitting(true);
    try {
      const [startH, startM] = selectedSlot.start.split(':').map(Number);
      const [endH, endM] = selectedSlot.end.split(':').map(Number);

      const startTime = new Date(selectedDate);
      startTime.setHours(startH, startM, 0, 0);

      const endTime = new Date(selectedDate);
      endTime.setHours(endH, endM, 0, 0);

      await onReschedule(booking.id, {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const isPastDay = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < today;
  };

  const isSelectedDay = (day) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (day) => {
    if (isPastDay(day)) return;
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  };

  const isPrevDisabled = () => {
    const today = new Date();
    return currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  };

  const formatTimeLabel = (time24) => {
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')}${ampm}`;
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Booking" size="lg">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {MONTHS[currentMonth.getMonth()]}{' '}
              <span className="text-gray-400">{currentMonth.getFullYear()}</span>
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                disabled={isPrevDisabled()}
                className="p-1.5 rounded-md hover:bg-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-1.5 rounded-md hover:bg-[#1a1a1a] transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1.5">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => (
              <div key={i} className="text-center">
                {day ? (
                  <button
                    onClick={() => handleDateClick(day)}
                    disabled={isPastDay(day)}
                    className={`w-full aspect-square rounded-md text-sm font-medium transition-all flex items-center justify-center
                      ${isPastDay(day)
                        ? 'text-gray-600 cursor-not-allowed'
                        : isSelectedDay(day)
                        ? 'bg-white text-[#0a0a0a] font-semibold'
                        : isToday(day)
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-300 hover:bg-[#1a1a1a]'
                      }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-full aspect-square" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="md:w-[200px] border-t md:border-t-0 md:border-l border-[#222222] pt-4 md:pt-0 md:pl-6">
          {!selectedDate ? (
            <p className="text-sm text-gray-500 text-center py-8">Select a date</p>
          ) : slotsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-[#1a1a1a] rounded-md animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No available times</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full py-2.5 px-3 text-sm font-medium border rounded-md transition-all text-center
                    ${selectedSlot?.start === slot.start
                      ? 'border-white bg-white text-[#0a0a0a]'
                      : 'border-[#282828] bg-[#1a1a1a] text-white hover:border-white/30'
                    }`}
                >
                  {formatTimeLabel(slot.start)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#222222]">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedSlot || submitting}
        >
          {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
        </Button>
      </div>
    </Modal>
  );
}