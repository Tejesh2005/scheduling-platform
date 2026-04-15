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
} from 'lucide-react';
import { publicAPI } from '../api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500">This event type does not exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  if (step === 'confirmation' && confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-md w-full p-6 sm:p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            This meeting is scheduled
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            We sent an email with a calendar invitation with the details to everyone.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 sm:p-5 text-left space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">What</p>
                <p className="text-sm font-medium text-gray-900 break-words">
                  {eventType.title} between {eventType.user_name || 'John Doe'} and {confirmedBooking.booker_name}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">When</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {formatTimeLabel(selectedSlot.start)} - {formatTimeLabel(selectedSlot.end)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Where</p>
                <p className="text-sm font-medium text-gray-900">{eventType.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Timezone</p>
                <p className="text-sm font-medium text-gray-900">
                  {eventType.user_timezone || 'America/New_York'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-6 sm:py-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-4xl w-full overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* Left Panel - Event Info */}
          <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-gray-200 p-5 sm:p-6">
            {step === 'form' && (
              <button
                onClick={() => {
                  setStep('calendar');
                  setSelectedSlot(null);
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold mb-3">
              {(eventType.user_name || 'J')[0]}
            </div>

            <p className="text-sm text-gray-500">{eventType.user_name || 'John Doe'}</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1 mb-4">{eventType.title}</h1>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {eventType.duration} min
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {eventType.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {eventType.user_timezone || 'America/New_York'}
              </div>

              {step === 'form' && selectedDate && selectedSlot && (
                <div className="flex items-start gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100 mt-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
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
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t border-gray-100">
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
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">
                    Select a Date & Time
                  </h2>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={prevMonth}
                        disabled={isPrevMonthDisabled()}
                        className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 mb-1">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, i) => (
                      <div key={i} className="text-center py-1">
                        {day && (
                          <button
                            onClick={() => handleDateClick(day)}
                            disabled={isPastDay(day)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-sm font-medium transition-all
                              ${isPastDay(day)
                                ? 'text-gray-300 cursor-not-allowed'
                                : isSelectedDay(day)
                                ? 'bg-[#111827] text-white'
                                : isToday(day)
                                ? 'border-2 border-[#111827] text-[#111827] hover:bg-gray-100'
                                : isWeekend(day)
                                ? 'text-gray-400 hover:bg-gray-100'
                                : 'text-gray-900 hover:bg-gray-100'
                              }
                            `}
                          >
                            {day}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="lg:w-[200px] border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </h3>

                    {slotsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse" />
                        ))}
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No available times</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1">
                        {slots.map((slot) => (
                          <button
                            key={slot.start}
                            onClick={() => handleSlotSelect(slot)}
                            className="w-full py-2.5 px-3 text-sm font-medium border border-gray-200 rounded-md
                              text-[#111827] hover:border-[#111827] hover:bg-[#111827] hover:text-white
                              transition-all text-center"
                          >
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
                <h2 className="text-sm font-semibold text-gray-900 mb-5">Enter Details</h2>
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      value={formData.booker_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booker_name: e.target.value }))}
                      className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent ${
                        formErrors.booker_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.booker_name && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.booker_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.booker_email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, booker_email: e.target.value }))}
                      className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent ${
                        formErrors.booker_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.booker_email && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.booker_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                    <textarea
                      placeholder="Please share anything that will help prepare for our meeting..."
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={booking}
                    className="w-full bg-[#111827] text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {booking ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}