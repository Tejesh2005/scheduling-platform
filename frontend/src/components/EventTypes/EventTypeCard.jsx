import { useState } from 'react';
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  MapPin,
} from 'lucide-react';
import Toggle from '../UI/Toggle';
import Badge from '../UI/Badge';

export default function EventTypeCard({ eventType, onEdit, onDelete, onToggle }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookingLink = `${window.location.origin}/johndoe/${eventType.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreview = () => {
    window.open(`/johndoe/${eventType.slug}`, '_blank');
  };

  return (
    <div
      className={`group relative bg-white border border-gray-200 hover:border-gray-300 transition-all ${
        !eventType.is_active ? 'opacity-65' : ''
      }`}
    >
      {/* Color accent on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md"
        style={{ backgroundColor: eventType.color || '#292929' }}
      />

      <div className="pl-6 pr-4 py-4">
        <div className="flex items-start justify-between">
          {/* Left side - Event info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {eventType.title}
              </h3>
              {!eventType.is_active && (
                <Badge variant="default">Disabled</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {eventType.duration} min
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {eventType.location}
              </span>
            </div>

            {eventType.description && (
              <p className="text-xs text-gray-400 line-clamp-1 mb-3">
                {eventType.description}
              </p>
            )}

            {/* Booking link + actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 truncate">
                /johndoe/{eventType.slug}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Copy link"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {copied && (
                <span className="text-xs text-green-600 font-medium">
                  Copied!
                </span>
              )}
              <button
                onClick={handlePreview}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Preview"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Right side - Toggle + Menu */}
          <div className="flex items-center gap-3 ml-4">
            <Toggle
              enabled={eventType.is_active}
              onChange={() => onToggle(eventType.id)}
            />

            {/* Three dot menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(eventType);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(eventType.id);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}