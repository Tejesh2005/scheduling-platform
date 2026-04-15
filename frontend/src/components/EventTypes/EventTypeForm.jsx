import { useState, useEffect } from 'react';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';

const colorOptions = [
  { value: '#292929', label: '⬛ Dark' },
  { value: '#4F46E5', label: '🟪 Indigo' },
  { value: '#0EA5E9', label: '🟦 Sky Blue' },
  { value: '#E11D48', label: '🟥 Rose' },
  { value: '#16A34A', label: '🟩 Green' },
  { value: '#F59E0B', label: '🟧 Amber' },
  { value: '#8B5CF6', label: '🟣 Purple' },
];

const durationOptions = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '2 hours' },
];

const locationOptions = [
  { value: 'Google Meet', label: 'Google Meet' },
  { value: 'Zoom', label: 'Zoom' },
  { value: 'Microsoft Teams', label: 'Microsoft Teams' },
  { value: 'Phone Call', label: 'Phone Call' },
  { value: 'In Person', label: 'In Person' },
];

export default function EventTypeForm({ eventType, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    duration: 30,
    location: 'Google Meet',
    color: '#292929',
    buffer_before: 0,
    buffer_after: 0,
    min_booking_notice: 60,
    max_booking_days: 60,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (eventType) {
      setForm({
        title: eventType.title || '',
        slug: eventType.slug || '',
        description: eventType.description || '',
        duration: eventType.duration || 30,
        location: eventType.location || 'Google Meet',
        color: eventType.color || '#292929',
        buffer_before: eventType.buffer_before || 0,
        buffer_after: eventType.buffer_after || 0,
        min_booking_notice: eventType.min_booking_notice || 60,
        max_booking_days: eventType.max_booking_days || 60,
      });
    }
  }, [eventType]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'title' && !eventType) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.slug.trim()) errs.slug = 'URL slug is required';
    if (!form.duration) errs.duration = 'Duration is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Title"
        placeholder="e.g. 30 Minute Meeting"
        value={form.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors.title}
      />

      <Input
        label="URL Slug"
        placeholder="e.g. 30min"
        value={form.slug}
        onChange={(e) => handleChange('slug', e.target.value)}
        error={errors.slug}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Description
        </label>
        <textarea
          className="block w-full rounded-md border border-[#333333] bg-[#1a1a1a] px-3 py-2 text-sm text-white shadow-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
          rows={3}
          placeholder="A brief description of this event type..."
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Duration"
          options={durationOptions}
          value={form.duration}
          onChange={(e) => handleChange('duration', parseInt(e.target.value))}
          error={errors.duration}
        />

        <Select
          label="Location"
          options={locationOptions}
          value={form.location}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      <Select
        label="Color"
        options={colorOptions}
        value={form.color}
        onChange={(e) => handleChange('color', e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Buffer Before (min)"
          type="number"
          min="0"
          value={form.buffer_before}
          onChange={(e) => handleChange('buffer_before', parseInt(e.target.value) || 0)}
        />
        <Input
          label="Buffer After (min)"
          type="number"
          min="0"
          value={form.buffer_after}
          onChange={(e) => handleChange('buffer_after', parseInt(e.target.value) || 0)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#222222]">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : eventType ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}