import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Calendar } from 'lucide-react';
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
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-24 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create events to share for people to book on your calendar.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          New Event Type
        </Button>
      </div>

      {/* Event Types List */}
      {eventTypes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No event types yet
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first event type to start accepting bookings.
          </p>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            New Event Type
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
          {eventTypes.map((et) => (
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
        <p className="text-sm text-gray-600 mb-6">
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