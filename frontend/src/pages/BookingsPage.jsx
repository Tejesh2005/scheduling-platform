// FILE: src/pages/BookingsPage.jsx

import { useState, useEffect, useMemo } from 'react';
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
  Search,
  CalendarClock,
  X as XIcon,
} from 'lucide-react';
import { bookingsAPI } from '../api';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import RescheduleModal from '../components/Bookings/RescheduleModal';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const ROWS_OPTIONS = [10, 25, 50];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleBooking, setRescheduleBooking] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, rowsPerPage]);

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
      setOpenMenuId(null);
      fetchBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const handleReschedule = async (bookingId, data) => {
    await bookingsAPI.reschedule(bookingId, data);
    setRescheduleBooking(null);
    setOpenMenuId(null);
    fetchBookings();
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
    return date
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase();
  };

  // Filtered bookings by search
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(
      (b) =>
        b.booker_name?.toLowerCase().includes(q) ||
        b.booker_email?.toLowerCase().includes(q) ||
        b.event_title?.toLowerCase().includes(q) ||
        b.notes?.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  // Paginated bookings
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredBookings.slice(start, start + rowsPerPage);
  }, [filteredBookings, currentPage, rowsPerPage]);

  // Group bookings by date label
  const groupedBookings = paginatedBookings.reduce((groups, booking) => {
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
      label = bookingDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).toUpperCase();
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(booking);
    return groups;
  }, {});

  const startRow = (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, filteredBookings.length);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Bookings</h1>
        <p className="text-sm text-gray-400 mt-1">
          See upcoming and past events booked through your event type links.
        </p>
      </div>

      {/* Tabs + Search */}
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

        {/* Search */}
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="flex items-center gap-2 bg-[#111111] border border-[#222222] rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, email, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none w-48 sm:w-64"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] rounded-md px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          )}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#1a1a1a] rounded w-24" />
          <div className="h-20 bg-[#1a1a1a] rounded" />
          <div className="h-20 bg-[#1a1a1a] rounded" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] rounded-lg p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
            {searchQuery ? (
              <Search className="w-8 h-8 text-gray-500" />
            ) : (
              <Calendar className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery
              ? 'No results found'
              : `No ${activeTab} bookings`}
          </h3>
          <p className="text-sm text-gray-400">
            {searchQuery
              ? `No bookings match "${searchQuery}"`
              : activeTab === 'upcoming'
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
                            {formatTime(booking.start_time)} -{' '}
                            {formatTime(booking.end_time)}
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
                              {booking.event_title} between John Doe and{' '}
                              {booking.booker_name}
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
                            <Badge variant="danger" className="mt-2">
                              Cancelled
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions - Dropdown Menu */}
                      <div className="flex items-center self-start">
                        {booking.status === 'confirmed' &&
                          activeTab === 'upcoming' && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === booking.id ? null : booking.id
                                  )
                                }
                                className="p-2 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {openMenuId === booking.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-9 z-20 w-48 bg-[#1a1a1a] border border-[#282828] rounded-lg shadow-xl py-1">
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setRescheduleBooking(booking);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-[#222222] hover:text-white"
                                    >
                                      <CalendarClock className="w-3.5 h-3.5" />
                                      Reschedule
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setCancelModal(booking.id);
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-[#222222] hover:text-red-300"
                                    >
                                      <XIcon className="w-3.5 h-3.5" />
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              )}
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
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="bg-[#1a1a1a] border border-[#282828] rounded-md px-2 py-1 text-sm text-white focus:outline-none"
              >
                {ROWS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">rows per page</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredBookings.length > 0
                  ? `${startRow}-${endRow} of ${filteredBookings.length}`
                  : '0 results'}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-[#1a1a1a] text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-[#1a1a1a] text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
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

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!rescheduleBooking}
        onClose={() => setRescheduleBooking(null)}
        booking={rescheduleBooking}
        onReschedule={handleReschedule}
      />
    </div>
  );
}