// FILE: src/components/EventTypes/EventTypeForm.jsx

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { eventTypesAPI } from '../../api';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import Toggle from '../UI/Toggle';

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

const questionTypeOptions = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
];

export default function EventTypeForm({ eventType, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    duration: 30,
    location: 'Google Meet',
    buffer_before: 0,
    buffer_after: 0,
    min_booking_notice: 60,
    max_booking_days: 60,
  });

  const [errors, setErrors] = useState({});

  // Custom questions state
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text',
    is_required: false,
    options: '',
  });
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  useEffect(() => {
    if (eventType) {
      setForm({
        title: eventType.title || '',
        slug: eventType.slug || '',
        description: eventType.description || '',
        duration: eventType.duration || 30,
        location: eventType.location || 'Google Meet',
        buffer_before: eventType.buffer_before || 0,
        buffer_after: eventType.buffer_after || 0,
        min_booking_notice: eventType.min_booking_notice || 60,
        max_booking_days: eventType.max_booking_days || 60,
      });
      fetchQuestions(eventType.id);
    }
  }, [eventType]);

  const fetchQuestions = async (eventTypeId) => {
    setQuestionsLoading(true);
    try {
      const res = await eventTypesAPI.getQuestions(eventTypeId);
      setQuestions(res.data.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text.trim()) return;

    try {
      const res = await eventTypesAPI.addQuestion(eventType.id, newQuestion);
      setQuestions((prev) => [...prev, res.data.data]);
      setNewQuestion({ question_text: '', question_type: 'text', is_required: false, options: '' });
      setShowAddQuestion(false);
    } catch (err) {
      alert('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await eventTypesAPI.deleteQuestion(eventType.id, questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      alert('Failed to delete question');
    }
  };

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

      {/* Custom Questions — only when editing */}
      {eventType && (
        <div className="border-t border-[#222222] pt-5">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              Custom Booking Questions
            </label>
            <button
              type="button"
              onClick={() => setShowAddQuestion(!showAddQuestion)}
              className="flex items-center gap-1 text-[12px] text-[#898989] hover:text-white border border-[#333333] rounded-md px-2.5 py-1 hover:bg-[#1a1a1a] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          {/* Existing questions */}
          {questionsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-10 bg-[#1a1a1a] rounded" />
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-2 mb-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between bg-[#1a1a1a] border border-[#252525] rounded-md px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white truncate">
                      {q.question_text}
                      {q.is_required && <span className="text-red-400 ml-1">*</span>}
                    </p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      {q.question_type === 'text' ? 'Short text' : q.question_type === 'textarea' ? 'Long text' : 'Dropdown'}
                      {q.options && ` • ${q.options}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 rounded-md hover:bg-red-900/20 text-[#555555] hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-[#555555] mb-4">
              No custom questions yet. Add questions that bookers must answer.
            </p>
          )}

          {/* Add question form */}
          {showAddQuestion && (
            <div className="bg-[#1a1a1a] border border-[#252525] rounded-lg p-4 space-y-3">
              <Input
                label="Question"
                placeholder="e.g. What would you like to discuss?"
                value={newQuestion.question_text}
                onChange={(e) =>
                  setNewQuestion((prev) => ({ ...prev, question_text: e.target.value }))
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Type"
                  options={questionTypeOptions}
                  value={newQuestion.question_type}
                  onChange={(e) =>
                    setNewQuestion((prev) => ({ ...prev, question_type: e.target.value }))
                  }
                />
                <div className="flex items-end pb-[2px]">
                  <Toggle
                    enabled={newQuestion.is_required}
                    onChange={(val) =>
                      setNewQuestion((prev) => ({ ...prev, is_required: val }))
                    }
                    label="Required"
                  />
                </div>
              </div>

              {newQuestion.question_type === 'select' && (
                <Input
                  label="Options (comma separated)"
                  placeholder="e.g. Option A, Option B, Option C"
                  value={newQuestion.options}
                  onChange={(e) =>
                    setNewQuestion((prev) => ({ ...prev, options: e.target.value }))
                  }
                />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddQuestion(false);
                    setNewQuestion({ question_text: '', question_type: 'text', is_required: false, options: '' });
                  }}
                  className="px-3 py-1.5 text-[12px] text-[#898989] hover:text-white border border-[#333333] rounded-md hover:bg-[#222222] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 text-[12px] font-medium text-[#0a0a0a] bg-white hover:bg-gray-100 rounded-md transition-colors"
                >
                  Add Question
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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