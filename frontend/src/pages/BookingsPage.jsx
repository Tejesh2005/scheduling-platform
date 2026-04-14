import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  X,
  FileText,
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Group bookings by date
  const groupedBookings = bookings.reduce((groups, booking) => {
    const dateKey = formatDate(booking.start_time);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(booking);
    return groups;
  }, {});

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="info">Completed</Badge>;
      case 'rescheduled':
        return <Badge variant="warning">Rescheduled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">
          See upcoming and past events booked through your event type links.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#111827] text-[#111827]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab} bookings
          </h3>
          <p className="text-sm text-gray-500">
            {activeTab === 'upcoming'
              ? 'You have no upcoming bookings. Share your booking link to get started.'
              : activeTab === 'past'
              ? 'No past bookings found.'
              : 'No cancelled bookings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBookings).map(([date, dateBookings]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {date}
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                {dateBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        {/* Time */}
                        <div className="text-sm min-w-[140px]">
                          <div className="font-semibold text-gray-900">
                            {formatTime(booking.start_time)} -{' '}
                            {formatTime(booking.end_time)}
                          </div>
                        </div>

                        {/* Details */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor: booking.color || '#292929',
                              }}
                            />
                            <span className="text-sm font-semibold text-gray-900">
                              {booking.event_title}
                            </span>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {booking.booker_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {booking.booker_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {booking.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {booking.location}
                            </span>
                          </div>

                          {booking.notes && (
                            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {booking.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {booking.status === 'confirmed' && activeTab === 'upcoming' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelModal(booking.id)}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel this booking? The booker will be
            notified.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for cancellation (optional)
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#111827]"
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