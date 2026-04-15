import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  FileText,
  MoreHorizontal,
  Video,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { bookingsAPI } from '../api';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingsAPI.getAll(activeTab);
      setBookings(res.data.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await bookingsAPI.cancel(cancelModal, cancelReason);
      setCancelModal(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  };

  // Group bookings by date label
  const groupedBookings = bookings.reduce((groups, booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.start_time);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let label;
    if (bookingDate.toDateString() === now.toDateString()) {
      label = 'TODAY';
    } else if (bookingDate.toDateString() === tomorrow.toDateString()) {
      label = 'TOMORROW';
    } else {
      label = 'NEXT';
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(booking);
    return groups;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Bookings</h1>
        <p className="text-sm text-gray-400 mt-1">
          See upcoming and past events booked through your event type links.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 bg-[#111111] border border-[#222222] rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#1a1a1a] rounded w-24" />
          <div className="h-20 bg-[#1a1a1a] rounded" />
          <div className="h-20 bg-[#1a1a1a] rounded" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] rounded-lg p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No {activeTab} bookings
          </h3>
          <p className="text-sm text-gray-400">
            {activeTab === 'upcoming'
              ? 'You have no upcoming bookings. Share your booking link to get started.'
              : activeTab === 'past'
              ? 'No past bookings found.'
              : 'No cancelled bookings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBookings).map(([label, dateBookings]) => (
            <div key={label}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {label}
              </h3>
              <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-hidden divide-y divide-[#1a1a1a]">
                {dateBookings.map((booking) => (
                  <div key={booking.id} className="px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 flex-1">
                        {/* Date & Time */}
                        <div className="sm:min-w-[160px]">
                          <div className="text-sm font-semibold text-white">
                            {formatDate(booking.start_time)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Video className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-blue-400 hover:underline cursor-pointer">
                              Join {booking.location || 'Cal Video'}
                            </span>
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">
                              {booking.event_title} between John Doe and {booking.booker_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                            <span>You and {booking.booker_name}</span>
                          </div>

                          {booking.notes && (
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              {booking.notes}
                            </p>
                          )}

                          {booking.status === 'cancelled' && (
                            <Badge variant="danger" className="mt-2">Cancelled</Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center self-start">
                        {booking.status === 'confirmed' && activeTab === 'upcoming' && (
                          <div className="relative">
                            <button
                              onClick={() => setCancelModal(booking.id)}
                              className="p-2 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between bg-[#111111] border border-[#222222] rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2">
              <select className="bg-[#1a1a1a] border border-[#282828] rounded-md px-2 py-1 text-sm text-white focus:outline-none">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="text-sm text-gray-500">rows per page</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                1-{bookings.length} of {bookings.length}
              </span>
              <button className="p-1 rounded hover:bg-[#1a1a1a] text-gray-500 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 rounded hover:bg-[#1a1a1a] text-gray-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => {
          setCancelModal(null);
          setCancelReason('');
        }}
        title="Cancel Booking"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Are you sure you want to cancel this booking? The booker will be
            notified.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Reason for cancellation (optional)
            </label>
            <textarea
              className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-gray-500"
              rows={3}
              placeholder="Let the booker know why..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setCancelModal(null);
                setCancelReason('');
              }}
            >
              Keep Booking
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              Cancel Booking
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}