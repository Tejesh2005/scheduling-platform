// FILE: src/pages/BookingsPage.jsx

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  FileText,
  MoreHorizontal,
  Video,
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarClock,
  X as XIcon,
  ChevronDown,
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

  // Filtered bookings
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

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredBookings.slice(start, start + rowsPerPage);
  }, [filteredBookings, currentPage, rowsPerPage]);

  const startRow = (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, filteredBookings.length);

  // Get section label
  const getSectionLabel = () => {
    if (activeTab === 'upcoming') return 'NEXT';
    if (activeTab === 'past') return 'PAST';
    if (activeTab === 'cancelled') return 'CANCELLED';
    return '';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white leading-tight">Bookings</h1>
        <p className="text-[13px] text-[#898989] mt-1">
          See upcoming and past events booked through your event type links.
        </p>
      </div>

      {/* Tabs row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Left — Tabs */}
        <div className="flex items-center gap-0 border border-[#2a2a2a] rounded-lg overflow-hidden">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-[13px] font-medium transition-colors border-r border-[#2a2a2a] last:border-r-0 ${
                activeTab === tab.key
                  ? 'text-white bg-[#1a1a1a]'
                  : 'text-[#777777] hover:text-white bg-transparent hover:bg-[#111111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right — Search */}
<div className="flex items-center gap-2">
  <div className="flex items-center gap-2 border border-[#2e2e2e] bg-[#101010] rounded-md px-3 py-[7px]">
    <Search className="w-4 h-4 text-[#666666]" />
    <input
      type="text"
      placeholder="Search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="bg-transparent text-sm text-white placeholder:text-[#666666] focus:outline-none w-28 sm:w-40"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="text-[#666666] hover:text-white transition-colors"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
</div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="bg-[#101010] border border-[#1c1c1c] rounded-lg">
          <div className="animate-pulse p-5 space-y-6">
            <div className="h-4 bg-[#1a1a1a] rounded w-16" />
            <div className="h-16 bg-[#1a1a1a] rounded" />
            <div className="h-16 bg-[#1a1a1a] rounded" />
          </div>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-[#101010] border border-[#1c1c1c] rounded-lg p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
            {searchQuery ? (
              <Search className="w-8 h-8 text-[#555555]" />
            ) : (
              <Calendar className="w-8 h-8 text-[#555555]" />
            )}
          </div>
          <h3 className="text-base font-semibold text-white mb-2">
            {searchQuery ? 'No results found' : `No ${activeTab} bookings`}
          </h3>
          <p className="text-sm text-[#898989]">
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
        <>
          {/* Main bookings card */}
          <div className="bg-[#101010] border border-[#1c1c1c] rounded-lg">
            {/* Section label */}
            <div className="px-5 pt-5 pb-3">
              <span className="text-[12px] font-semibold text-[#888888] tracking-wider">
                {getSectionLabel()}
              </span>
            </div>

            {/* Booking rows */}
            <div className="divide-y divide-[#1c1c1c]">
              {paginatedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-start justify-between px-5 py-5 hover:bg-[#141414] transition-colors"
                >
                  {/* Left — Date, Time, Join link */}
                  <div className="flex gap-10 flex-1 min-w-0">
                    {/* Date & Time column */}
                    <div className="min-w-[170px] flex-shrink-0">
                      <p className="text-[14px] font-semibold text-white leading-tight">
                        {formatDate(booking.start_time)}
                      </p>
                      <p className="text-[13px] text-[#888888] mt-0.5">
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Video className="w-3.5 h-3.5 text-[#555555]" />
                        <span className="text-[12px] text-[#2ed1a3] hover:underline cursor-pointer font-medium">
                          Join Cal Video
                        </span>
                      </div>
                    </div>

                    {/* Event details column */}
                    <div className="flex-1 min-w-0 pt-[1px]">
                      <p className="text-[14px] font-semibold text-white leading-tight truncate">
                        {booking.event_title} between John Doe and {booking.booker_name}
                      </p>
                      <p className="text-[13px] text-[#888888] mt-0.5">
                        You and {booking.booker_name}
                      </p>

                      {booking.notes && (
                        <p className="text-[12px] text-[#666666] mt-2 flex items-center gap-1.5">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{booking.notes}</span>
                        </p>
                      )}

                      {booking.status === 'cancelled' && (
                        <Badge variant="danger" className="mt-2">Cancelled</Badge>
                      )}
                    </div>
                  </div>

                  {/* Right — Actions */}
                  {booking.status === 'confirmed' && activeTab === 'upcoming' && (
                    <div className="relative flex-shrink-0 ml-4">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === booking.id ? null : booking.id)
                        }
                        className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-[#333333] bg-transparent hover:bg-[#1c1c1c] text-[#777777] hover:text-white transition-colors"
                      >
                        <MoreHorizontal className="w-[15px] h-[15px] stroke-[2.5]" />
                      </button>

                      {openMenuId === booking.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-10 z-20 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl py-1 overflow-hidden">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setRescheduleBooking(booking);
                              }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-[#cccccc] hover:bg-[#252525] hover:text-white transition-colors"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              Reschedule
                            </button>
                            <div className="border-t border-[#2a2a2a]" />
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setCancelModal(booking.id);
                              }}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-red-400 hover:bg-[#252525] hover:text-red-300 transition-colors"
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
              ))}
            </div>
          </div>

          {/* Pagination — separate bar below */}
          <div className="flex items-center justify-between px-2 py-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-[#2a2a2a] rounded-md overflow-hidden">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="bg-transparent border-none px-2.5 py-1 text-[13px] text-white focus:outline-none appearance-none cursor-pointer pr-6"
                >
                  {ROWS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#1a1a1a]">
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[#666666] -ml-5 mr-2 pointer-events-none" />
              </div>
              <span className="text-[13px] text-[#777777]">rows per page</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#777777]">
                {filteredBookings.length > 0
                  ? `${startRow}-${endRow} of ${filteredBookings.length}`
                  : '0 results'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-[#1a1a1a] text-[#666666] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded hover:bg-[#1a1a1a] text-[#666666] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
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
          <p className="text-sm text-[#898989]">
            Are you sure you want to cancel this booking? The booker will be notified.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Reason for cancellation (optional)
            </label>
            <textarea
              className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-[#555555]"
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