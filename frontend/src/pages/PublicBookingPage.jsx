import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Globe,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Check,
  Calendar,
  User,
  Video,
} from 'lucide-react';
import { publicAPI } from '../api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PublicBookingPage() {
  const { username, slug } = useParams();
  const [eventType, setEventType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [use24h, setUse24h] = useState(false);

  const [step, setStep] = useState('calendar');
  const [formData, setFormData] = useState({
    booker_name: '',
    booker_email: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [booking, setBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    const fetchEventType = async () => {
      try {
        const res = await publicAPI.getEventType(username, slug);
        setEventType(res.data.data);
      } catch (err) {
        setError('Event type not found');
      } finally {
        setLoading(false);
      }
    };
    fetchEventType();
  }, [username, slug]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlots = async (date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const dateStr = formatDateStr(date);
      const res = await publicAPI.getSlots(username, slug, dateStr);
      setSlots(res.data.data);
    } catch (err) {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isPastDay = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate < today;
  };

  const isSelectedDay = (day) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isWeekend = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isAvailableDay = (day) => {
    if (isPastDay(day)) return false;
    if (isWeekend(day)) return false;
    return true;
  };

  const handleDateClick = (day) => {
    if (isPastDay(day)) return;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(date);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
  };

  const isPrevMonthDisabled = () => {
    const today = new Date();
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    );
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.booker_name.trim()) errors.booker_name = 'Name is required';
    if (!formData.booker_email.trim()) errors.booker_email = 'Email is required';
    if (formData.booker_email && !/\S+@\S+\.\S+/.test(formData.booker_email)) {
      errors.booker_email = 'Invalid email address';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBooking(true);
    try {
      const [startH, startM] = selectedSlot.start.split(':').map(Number);
      const [endH, endM] = selectedSlot.end.split(':').map(Number);

      const startTime = new Date(selectedDate);
      startTime.setHours(startH, startM, 0, 0);

      const endTime = new Date(selectedDate);
      endTime.setHours(endH, endM, 0, 0);

      const res = await publicAPI.book(username, slug, {
        booker_name: formData.booker_name,
        booker_email: formData.booker_email,
        notes: formData.notes,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      setConfirmedBooking(res.data.data);
      setStep('confirmation');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to book. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const formatTimeLabel = (time24) => {
    if (use24h) return time24;
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')}${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-[#1a1a1a] rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-[#1a1a1a] rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-gray-400">This event type does not exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  // Confirmation
  if (step === 'confirmation' && confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8">
        <div className="bg-[#111111] border border-[#222222] rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center">
          <div className="w-14 h-14 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">
            This meeting is scheduled
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            We sent an email with a calendar invitation with the details to everyone.
          </p>
          <div className="bg-[#0a0a0a] rounded-lg p-4 sm:p-5 text-left space-y-3 border border-[#222222]">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">What</p>
                <p className="text-sm font-medium text-white break-words">
                  {eventType.title} between {eventType.user_name || 'John Doe'} and {confirmedBooking.booker_name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">When</p>
                <p className="text-sm font-medium text-white">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-400">
                  {formatTimeLabel(selectedSlot.start)} - {formatTimeLabel(selectedSlot.end)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Where</p>
                <p className="text-sm font-medium text-white">{eventType.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Timezone</p>
                <p className="text-sm font-medium text-white">
                  {eventType.user_timezone || 'Asia/Kolkata'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calendar
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-6 sm:py-8">
      <div className="bg-[#111111] border border-[#222222] rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* Left Panel - Event Info */}
          <div className="w-full md:w-[260px] border-b md:border-b-0 md:border-r border-[#222222] p-5 sm:p-6">
            {step === 'form' && (
              <button
                onClick={() => {
                  setStep('calendar');
                  setSelectedSlot(null);
                }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            <div className="w-9 h-9 rounded-full bg-amber-700 flex items-center justify-center text-white text-sm font-semibold mb-3 lowercase">
              {(eventType.user_name || 'J')[0].toLowerCase()}
            </div>

            <p className="text-sm text-gray-400">{eventType.user_name || 'John Doe'}</p>
            <h1 className="text-lg font-bold text-white mt-0.5 mb-4">{eventType.title}</h1>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                {eventType.duration}m
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Video className="w-4 h-4 text-gray-500 flex-shrink-0" />
                {eventType.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                {eventType.user_timezone || 'Asia/Kolkata'}
              </div>

              {step === 'form' && selectedDate && selectedSlot && (
                <div className="flex items-start gap-2 text-sm text-gray-400 pt-2 border-t border-[#222222] mt-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p>{formatTimeLabel(selectedSlot.start)} - {formatTimeLabel(selectedSlot.end)}</p>
                  </div>
                </div>
              )}
            </div>

            {eventType.description && (
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-[#222222]">
                {eventType.description}
              </p>
            )}
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-5 sm:p-6">
            {step === 'calendar' && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar */}
                <div className="flex-1">
                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-white">
                      {MONTHS[currentMonth.getMonth()]}{' '}
                      <span className="text-gray-400">{currentMonth.getFullYear()}</span>
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={prevMonth}
                        disabled={isPrevMonthDisabled()}
                        className="p-1.5 rounded-md hover:bg-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-md hover:bg-[#1a1a1a] transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => (
                      <div key={i} className="text-center">
                        {day ? (
                          <button
                            onClick={() => handleDateClick(day)}
                            disabled={isPastDay(day)}
                            className={`w-full aspect-square rounded-md text-sm font-medium transition-all flex items-center justify-center relative
                              ${isPastDay(day)
                                ? 'text-gray-600 cursor-not-allowed'
                                : isSelectedDay(day)
                                ? 'bg-white text-[#0a0a0a] font-semibold'
                                : isToday(day)
                                ? 'bg-white text-[#0a0a0a] font-semibold'
                                : isAvailableDay(day)
                                ? 'bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#282828]'
                                : 'text-gray-500'
                              }
                            `}
                          >
                            {day}
                            {isToday(day) && !isSelectedDay(day) && (
                              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-500 rounded-full" />
                            )}
                          </button>
                        ) : (
                          <div className="w-full aspect-square" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="lg:w-[220px] border-t lg:border-t-0 lg:border-l border-[#222222] pt-4 lg:pt-0 lg:pl-6">
                    {/* Time slot header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">
                        {WEEKDAYS_SHORT[selectedDate.getDay()]}{' '}
                        <span>{selectedDate.getDate()}</span>
                      </h3>
                      <div className="flex items-center bg-[#1a1a1a] border border-[#282828] rounded-md overflow-hidden">
                        <button
                          onClick={() => setUse24h(false)}
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            !use24h ? 'bg-[#282828] text-white' : 'text-gray-500'
                          }`}
                        >
                          12h
                        </button>
                        <button
                          onClick={() => setUse24h(true)}
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            use24h ? 'bg-[#282828] text-white' : 'text-gray-500'
                          }`}
                        >
                          24h
                        </button>
                      </div>
                    </div>

                    {slotsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-10 bg-[#1a1a1a] rounded-md animate-pulse" />
                        ))}
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No available times</p>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {slots.map((slot) => (
                          <button
                            key={slot.start}
                            onClick={() => handleSlotSelect(slot)}
                            className="w-full py-2.5 px-4 text-sm font-medium border border-[#282828] rounded-md
                              bg-[#1a1a1a] text-white hover:border-white/30 hover:bg-[#222222]
                              transition-all text-center flex items-center justify-center gap-2"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                            {formatTimeLabel(slot.start)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Booking Form */}
            {step === 'form' && (
              <div>
                <h2 className="text-sm font-semibold text-white mb-5">Enter Details</h2>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={formData.booker_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booker_name: e.target.value }))}
                      className={`block w-full rounded-md border bg-[#1a1a1a] px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent ${
                        formErrors.booker_name ? 'border-red-500' : 'border-[#333333]'
                      }`}
                    />
                    {formErrors.booker_name && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.booker_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.booker_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booker_email: e.target.value }))}
                      className={`block w-full rounded-md border bg-[#1a1a1a] px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent ${
                        formErrors.booker_email ? 'border-red-500' : 'border-[#333333]'
                      }`}
                    />
                    {formErrors.booker_email && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.booker_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Additional Notes</label>
                    <textarea
                      placeholder="Please share anything that will help prepare for our meeting..."
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={booking}
                    className="w-full bg-white text-[#0a0a0a] py-2.5 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {booking ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cal.com Footer */}
      <p className="text-sm font-semibold text-gray-500 mt-6">Cal.com</p>
    </div>
  );
}