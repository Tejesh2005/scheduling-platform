import { useState } from 'react';
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
} from 'lucide-react';
import Toggle from '../UI/Toggle';

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
      className={`group relative bg-[#111111] hover:bg-[#161616] transition-all ${
        !eventType.is_active ? 'opacity-50' : ''
      }`}
    >
      <div className="px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left side - Event info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-sm font-semibold text-white truncate">
                {eventType.title}
              </h3>
              <span className="text-xs text-gray-500 truncate hidden sm:inline">
                /johndoe/{eventType.slug}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-[#1a1a1a] border border-[#282828] rounded px-2 py-0.5">
                <Clock className="w-3 h-3" />
                {eventType.duration}m
              </span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 sm:gap-1">
            {!eventType.is_active && (
              <span className="text-xs text-gray-500 mr-2">Hidden</span>
            )}

            <Toggle
              enabled={eventType.is_active}
              onChange={() => onToggle(eventType.id)}
            />

            <div className="flex items-center ml-2 gap-0.5">
              <button
                onClick={handlePreview}
                className="p-2 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors"
                title="Preview"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={handleCopy}
                className="p-2 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors"
                title={copied ? 'Copied!' : 'Copy link'}
              >
                <Copy className="w-4 h-4" />
              </button>

              {/* Three dot menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-md hover:bg-[#1a1a1a] text-gray-500 hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-9 z-20 w-44 bg-[#1a1a1a] border border-[#282828] rounded-lg shadow-xl py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(eventType);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-[#222222] hover:text-white"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(eventType.id);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-[#222222] hover:text-red-300"
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
    </div>
  );
}