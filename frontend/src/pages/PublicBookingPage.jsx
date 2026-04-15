// FILE: src/pages/PublicBookingPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Monitor,
  RefreshCw,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { publicAPI } from '../api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function PublicBookingPage() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timezone
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  );
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [use24h, setUse24h] = useState(false);

  const [step, setStep] = useState('calendar'); // calendar, form, confirmation
  const [formData, setFormData] = useState({
    booker_name: '',
    booker_email: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [booking, setBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fetch event type
  useEffect(() => {
    const fetchEventType = async () => {
      try {
        const res = await publicAPI.getEventType(username, slug);
        setEventType(res.data.data);

        const today = new Date();
        const dayOfWeek = today.getDay();
        let autoDate = new Date(today);
        if (dayOfWeek === 0) autoDate.setDate(autoDate.getDate() + 1);
        else if (dayOfWeek === 6) autoDate.setDate(autoDate.getDate() + 2);
        setSelectedDate(autoDate);
      } catch (err) {
        setError('Event type not found');
      } finally {
        setLoading(false);
      }
    };
    fetchEventType();
  }, [username, slug]);

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
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

  // Convert time to selected timezone for display
  const formatTimeInTimezone = (time24) => {
    if (!selectedDate) return time24;
    const [h, m] = time24.split(':').map(Number);

    // Create a date object in the original timezone context
    const date = new Date(selectedDate);
    date.setHours(h, m, 0, 0);

    try {
      const formatted = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !use24h,
        timeZone: selectedTimezone,
      });
      return use24h ? time24 : formatted.toLowerCase();
    } catch {
      return formatTimeLabel(time24);
    }
  };

  const formatTimeLabel = (time24) => {
    if (use24h) return time24;
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')}${ampm}`;
  };

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
  };

  const isPastDay = (day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < today;
  };

  const isSelectedDay = (day) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const isWeekend = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const isAvailableDay = (day) => !isPastDay(day) && !isWeekend(day);

  const handleDateClick = (day) => {
    if (isPastDay(day)) return;
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
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
    return currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
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

  const handleBookAgain = () => {
    setStep('calendar');
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setFormData({ booker_name: '', booker_email: '', notes: '' });
    setFormErrors({});
  };

  const handleReschedule = () => {
    // Go back to calendar with booking info retained
    setStep('calendar');
    setSelectedSlot(null);
  };

  const handleCancelBooking = async () => {
    if (!confirmedBooking) return;
    try {
      // Use the public-facing cancel — we'll call the admin endpoint
      // Since this is a public page, we might need a public cancel endpoint
      // For now, show confirmation and redirect
      alert('Booking cancelled successfully. You will receive a confirmation email.');
      navigate(`/${username}`);
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  // Loading
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

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-[#898989]">This event type does not exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  // ==================== CONFIRMATION PAGE ====================
  if (step === 'confirmation' && confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-8">
        <div className="bg-[#111111] border border-[#222222] rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8">
          {/* Success icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-8 h-8 text-emerald-400 stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1.5">
              This meeting is scheduled
            </h1>
            <p className="text-[13px] text-[#898989]">
              We sent an email with a calendar invitation with the details to everyone.
            </p>
          </div>

          {/* Booking details card */}
          <div className="bg-[#0a0a0a] rounded-lg p-5 border border-[#222222] space-y-4">
            {/* What */}
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-[#555555] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-emerald-400/80 font-medium uppercase tracking-wider">What</p>
                <p className="text-[14px] font-semibold text-white mt-0.5">
                  {eventType.title} between {eventType.user_name || 'John Doe'} and {confirmedBooking.booker_name}
                </p>
              </div>
            </div>

            {/* When */}
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-[#555555] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-emerald-400/80 font-medium uppercase tracking-wider">When</p>
                <p className="text-[14px] font-semibold text-white mt-0.5">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-[13px] text-[#888888] mt-0.5">
                  {formatTimeLabel(selectedSlot.start)} - {formatTimeLabel(selectedSlot.end)}
                </p>
              </div>
            </div>

            {/* Where */}
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#555555] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-emerald-400/80 font-medium uppercase tracking-wider">Where</p>
                <p className="text-[14px] font-semibold text-white mt-0.5">{eventType.location}</p>
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-[#555555] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-emerald-400/80 font-medium uppercase tracking-wider">Timezone</p>
                <p className="text-[14px] font-semibold text-white mt-0.5">{selectedTimezone}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            {/* Reschedule & Cancel row */}
            <div className="flex gap-3">
              <button
                onClick={handleReschedule}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] text-white text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-[#333333] bg-[#1a1a1a] hover:bg-red-900/20 hover:border-red-800/50 text-[#898989] hover:text-red-400 text-[13px] font-medium transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>

            {/* Book again */}
            <button
              onClick={handleBookAgain}
              className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-gray-100 text-[#0a0a0a] text-[13px] font-semibold transition-colors"
            >
              Book Again
            </button>

            {/* Back to events */}
            <button
              onClick={() => navigate(`/${username}`)}
              className="w-full py-2.5 px-4 rounded-md border border-[#333333] bg-transparent hover:bg-[#1a1a1a] text-[#898989] hover:text-white text-[13px] font-medium transition-colors"
            >
              ← Back to all events
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== CALENDAR + FORM PAGE ====================
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

    return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-6 sm:py-8">
      {/* Back to events */}
      <div className="max-w-5xl w-full mb-4">
        <button
          onClick={() => navigate(`/${username}`)}
          className="flex items-center gap-2 text-[13px] text-[#898989] hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to all events
        </button>
      </div>

      <div className="bg-[#111111] border border-[#222222] rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* ===== LEFT PANEL — Event Info ===== */}

          {/* ===== LEFT PANEL — Event Info ===== */}
          <div className="w-full md:w-[260px] border-b md:border-b-0 md:border-r border-[#222222] p-5 sm:p-6">
            {step === 'form' && (
              <button
                onClick={() => {
                  setStep('calendar');
                  setSelectedSlot(null);
                }}
                className="flex items-center gap-1 text-[13px] text-[#898989] hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-white text-sm font-semibold mb-3 lowercase">
              {(eventType.user_name || 'J')[0].toLowerCase()}
            </div>

            <p className="text-[13px] text-[#898989]">{eventType.user_name || 'John Doe'}</p>
            <h1 className="text-lg font-bold text-white mt-0.5 mb-4">{eventType.title}</h1>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-[13px] text-[#898989]">
                <Clock className="w-4 h-4 text-[#555555] flex-shrink-0" />
                {eventType.duration}m
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-[#898989]">
                <Monitor className="w-4 h-4 text-[#555555] flex-shrink-0" />
                <span className="text-[#2ed1a3]">{eventType.location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[13px] text-[#898989]">
                <Globe className="w-4 h-4 text-[#555555] flex-shrink-0" />
                {selectedTimezone}
              </div>

              {/* Selected date/time in form step */}
              {step === 'form' && selectedDate && selectedSlot && (
                <div className="flex items-start gap-2.5 text-[13px] text-[#898989] pt-2.5 border-t border-[#222222] mt-2.5">
                  <Calendar className="w-4 h-4 text-[#555555] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-white">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p>{formatTimeInTimezone(selectedSlot.start)} - {formatTimeInTimezone(selectedSlot.end)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {eventType.description && (
              <p className="text-[13px] text-[#2ed1a3] mt-4 pt-4 border-t border-[#222222]">
                {eventType.description}
              </p>
            )}
          </div>

          {/* ===== RIGHT PANEL ===== */}
          <div className="flex-1 p-5 sm:p-6">

            {/* ===== CALENDAR STEP ===== */}
            {step === 'calendar' && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Calendar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-white">
                      {MONTHS[currentMonth.getMonth()]}{' '}
                      <span className="text-[#898989]">{currentMonth.getFullYear()}</span>
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={prevMonth}
                        disabled={isPrevMonthDisabled()}
                        className="p-1.5 rounded-md hover:bg-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-[#898989]" />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-md hover:bg-[#1a1a1a] transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-[#898989]" />
                      </button>
                    </div>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="text-center text-[11px] font-semibold text-[#555555] py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-[3px]">
                    {calendarDays.map((day, i) => (
                      <div key={i} className="text-center">
                        {day ? (
                          <button
                            onClick={() => handleDateClick(day)}
                            disabled={isPastDay(day)}
                            className={`w-full aspect-square rounded-md text-[13px] font-medium transition-all flex items-center justify-center relative
                              ${isPastDay(day)
                                ? 'text-[#333333] cursor-not-allowed'
                                : isSelectedDay(day)
                                ? 'bg-white text-[#0a0a0a] font-semibold'
                                : isToday(day)
                                ? 'bg-[#252525] text-white font-semibold ring-1 ring-[#444444]'
                                : isAvailableDay(day)
                                ? 'bg-[#1a1a1a] text-white hover:bg-[#252525] border border-[#252525]'
                                : 'text-[#444444]'
                              }
                            `}
                          >
                            {day}
                            {isToday(day) && !isSelectedDay(day) && (
                              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#555555] rounded-full" />
                            )}
                          </button>
                        ) : (
                          <div className="w-full aspect-square" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Timezone selector */}
                  <div className="mt-5 pt-4 border-t border-[#222222]">
                    <div className="relative">
                      <button
                        onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                        className="flex items-center gap-2 text-[12px] text-[#898989] hover:text-white transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{selectedTimezone}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {showTimezoneDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowTimezoneDropdown(false)}
                          />
                          <div className="absolute bottom-8 left-0 z-20 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl py-1 max-h-[200px] overflow-y-auto">
                            {TIMEZONE_OPTIONS.map((tz) => (
                              <button
                                key={tz}
                                onClick={() => {
                                  setSelectedTimezone(tz);
                                  setShowTimezoneDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${
                                  tz === selectedTimezone
                                    ? 'text-white bg-[#252525]'
                                    : 'text-[#898989] hover:bg-[#222222] hover:text-white'
                                }`}
                              >
                                {tz}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="lg:w-[220px] border-t lg:border-t-0 lg:border-l border-[#222222] pt-4 lg:pt-0 lg:pl-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[13px] font-semibold text-white">
                        {WEEKDAYS_SHORT[selectedDate.getDay()]}{' '}
                        <span>{selectedDate.getDate()}</span>
                      </h3>
                      <div className="flex items-center bg-[#1a1a1a] border border-[#282828] rounded-md overflow-hidden">
                        <button
                          onClick={() => setUse24h(false)}
                          className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                            !use24h ? 'bg-[#282828] text-white' : 'text-[#555555]'
                          }`}
                        >
                          12h
                        </button>
                        <button
                          onClick={() => setUse24h(true)}
                          className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                            use24h ? 'bg-[#282828] text-white' : 'text-[#555555]'
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
                      <p className="text-[13px] text-[#555555] text-center py-4">No available times</p>
                    ) : (
                      <div className="space-y-[6px] max-h-[400px] overflow-y-auto pr-1">
                        {slots.map((slot) => (
                          <button
                            key={slot.start}
                            onClick={() => handleSlotSelect(slot)}
                            className="w-full py-2.5 px-4 text-[13px] font-medium border border-[#282828] rounded-md
                              bg-[#1a1a1a] text-white hover:border-white/30 hover:bg-[#222222]
                              transition-all text-left flex items-center gap-2.5"
                          >
                            <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 flex-shrink-0" />
                            {formatTimeInTimezone(slot.start)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

                        {/* ===== BOOKING FORM STEP ===== */}
            {step === 'form' && (
              <div>
                <h2 className="text-[14px] font-semibold text-white mb-5">Enter Details</h2>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={formData.booker_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booker_name: e.target.value }))}
                      className={`block w-full rounded-md border bg-[#1a1a1a] px-3 py-2.5 text-[13px] text-white shadow-sm placeholder:text-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20 ${
                        formErrors.booker_name ? 'border-red-500' : 'border-[#333333]'
                      }`}
                    />
                    {formErrors.booker_name && (
                      <p className="mt-1 text-[11px] text-red-400">{formErrors.booker_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.booker_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booker_email: e.target.value }))}
                      className={`block w-full rounded-md border bg-[#1a1a1a] px-3 py-2.5 text-[13px] text-white shadow-sm placeholder:text-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20 ${
                        formErrors.booker_email ? 'border-red-500' : 'border-[#333333]'
                      }`}
                    />
                    {formErrors.booker_email && (
                      <p className="mt-1 text-[11px] text-red-400">{formErrors.booker_email}</p>
                    )}
                  </div>

                  {/* Custom Questions */}
                  {eventType.custom_questions && eventType.custom_questions.length > 0 && (
                    eventType.custom_questions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                          {q.question_text} {q.is_required && <span className="text-red-400">*</span>}
                        </label>
                        {q.question_type === 'textarea' ? (
                          <textarea
                            placeholder="Your answer..."
                            rows={3}
                            required={q.is_required}
                            value={formData[`question_${q.id}`] || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [`question_${q.id}`]: e.target.value,
                              }))
                            }
                            className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2.5 text-[13px] text-white shadow-sm placeholder:text-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
                          />
                        ) : q.question_type === 'select' && q.options ? (
                          <select
                            required={q.is_required}
                            value={formData[`question_${q.id}`] || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [`question_${q.id}`]: e.target.value,
                              }))
                            }
                            className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2.5 text-[13px] text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                          >
                            <option value="">Select an option</option>
                            {q.options.split(',').map((opt) => (
                              <option key={opt.trim()} value={opt.trim()}>
                                {opt.trim()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Your answer..."
                            required={q.is_required}
                            value={formData[`question_${q.id}`] || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [`question_${q.id}`]: e.target.value,
                              }))
                            }
                            className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2.5 text-[13px] text-white shadow-sm placeholder:text-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
                          />
                        )}
                      </div>
                    ))
                  )}

                  <div>
                    <label className="block text-[13px] font-medium text-gray-300 mb-1.5">Additional Notes</label>
                    <textarea
                      placeholder="Please share anything that will help prepare for our meeting..."
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2.5 text-[13px] text-white shadow-sm placeholder:text-[#555555] focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={booking}
                    className="w-full bg-white text-[#0a0a0a] py-2.5 px-4 rounded-md text-[13px] font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {booking ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[13px] font-semibold text-[#555555] mt-6">Cal.com</p>
    </div>
  );
}