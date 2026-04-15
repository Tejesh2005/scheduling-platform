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

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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

  // Filtered event types based on search
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Event types</h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure different events for people to book on your calendar.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {showSearch ? (
            <div className="flex items-center gap-2 border border-[#333333] bg-[#1a1a1a] rounded-md px-3 py-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search event types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none w-40 sm:w-52"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
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
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] rounded-md px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {/* Event Types List */}
      {filteredEventTypes.length === 0 ? (
        <div className="bg-[#111111] border border-[#222222] rounded-lg p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
            {searchQuery ? (
              <Search className="w-8 h-8 text-gray-500" />
            ) : (
              <Calendar className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery ? 'No results found' : 'No event types yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {searchQuery
              ? `No event types match "${searchQuery}"`
              : 'Create your first event type to start accepting bookings.'}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Event Type
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-hidden divide-y divide-[#1e1e1e]">
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
        <p className="text-sm text-gray-400 mb-6">
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