// FILE: src/pages/EventTypesPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { Plus, Calendar, Search, X } from 'lucide-react';
import { eventTypesAPI } from '../api';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import EventTypeCard from '../components/EventTypes/EventTypeCard';
import EventTypeForm from '../components/EventTypes/EventTypeForm';

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEventType, setEditingEventType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const res = await eventTypesAPI.getAll();
      setEventTypes(res.data.data);
    } catch (err) {
      console.error('Error fetching event types:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEventTypes = useMemo(() => {
    if (!searchQuery.trim()) return eventTypes;
    const q = searchQuery.toLowerCase();
    return eventTypes.filter(
      (et) =>
        et.title?.toLowerCase().includes(q) ||
        et.slug?.toLowerCase().includes(q) ||
        et.description?.toLowerCase().includes(q)
    );
  }, [eventTypes, searchQuery]);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await eventTypesAPI.create(data);
      await fetchEventTypes();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating event type');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await eventTypesAPI.update(editingEventType.id, data);
      await fetchEventTypes();
      setEditingEventType(null);
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating event type');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await eventTypesAPI.toggle(id);
      await fetchEventTypes();
    } catch (err) {
      console.error('Error toggling event type:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await eventTypesAPI.delete(id);
      await fetchEventTypes();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting event type:', err);
    }
  };

  const openEditModal = (eventType) => {
    setEditingEventType(eventType);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingEventType(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[#1a1a1a] rounded w-48" />
        <div className="h-20 bg-[#1a1a1a] rounded" />
        <div className="h-20 bg-[#1a1a1a] rounded" />
        <div className="h-20 bg-[#1a1a1a] rounded" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header — matches Cal.com exactly */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-white leading-tight">Event types</h1>
          <p className="text-[13px] text-[#898989] mt-1">
            Configure different events for people to book on your calendar.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Search — always visible input */}
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
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* + New Button — white, prominent */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-[#0a0a0a] rounded-md px-4 py-[7px] text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New
          </button>
        </div>
      </div>

      {/* Event Types List — edge to edge card */}
      {filteredEventTypes.length === 0 ? (
        <div className="bg-[#101010] border border-[#1c1c1c] rounded-lg p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
            {searchQuery ? (
              <Search className="w-8 h-8 text-[#555555]" />
            ) : (
              <Calendar className="w-8 h-8 text-[#555555]" />
            )}
          </div>
          <h3 className="text-base font-semibold text-white mb-2">
            {searchQuery ? 'No results found' : 'No event types yet'}
          </h3>
          <p className="text-sm text-[#898989] mb-6">
            {searchQuery
              ? `No event types match "${searchQuery}"`
              : 'Create your first event type to start accepting bookings.'}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-100 text-[#0a0a0a] rounded-md px-4 py-2 text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event Type
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#101010] border border-[#1c1c1c] rounded-lg overflow-hidden divide-y divide-[#1c1c1c]">
          {filteredEventTypes.map((et) => (
            <EventTypeCard
              key={et.id}
              eventType={et}
              onEdit={openEditModal}
              onDelete={(id) => setShowDeleteConfirm(id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEventType(null);
        }}
        title={editingEventType ? 'Edit Event Type' : 'New Event Type'}
      >
        <EventTypeForm
          eventType={editingEventType}
          onSubmit={editingEventType ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowModal(false);
            setEditingEventType(null);
          }}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Event Type"
        size="sm"
      >
        <p className="text-sm text-[#898989] mb-6">
          Are you sure you want to delete this event type? This action cannot be
          undone and will cancel all upcoming bookings.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete(showDeleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}