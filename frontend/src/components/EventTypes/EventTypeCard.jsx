// FILE: src/components/EventTypes/EventTypeCard.jsx

import { useState } from 'react';
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
} from 'lucide-react';
import Toggle from '../UI/Toggle';
import Tooltip from '../UI/Tooltip';

// Custom chain link icon to match Cal.com exactly
function LinkIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

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
      className={`group relative hover:bg-[#151515] transition-colors ${
        !eventType.is_active ? 'opacity-65' : ''
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4">
        {/* Left — Event Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1.5">
            <h3 className="text-[14px] font-semibold text-white truncate leading-tight">
              {eventType.title}
            </h3>
            <span className="text-[13px] text-[#555555] truncate hidden sm:inline font-normal">
              /johndoe/{eventType.slug}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[12px] text-[#a0a0a0] bg-[#1a1a1a] border border-[#252525] rounded-full px-2.5 py-[3px] font-medium">
              <Clock className="w-3 h-3 text-[#777777]" />
              {eventType.duration}m
            </span>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!eventType.is_active && (
            <span className="text-[13px] text-[#777777] mr-1 hidden sm:inline font-medium">
              Hidden
            </span>
          )}

          <Toggle
            enabled={eventType.is_active}
            onChange={() => onToggle(eventType.id)}
          />

          {/* Grouped action buttons */}
          <div className="flex items-center border border-[#333333] rounded-lg overflow-visible divide-x divide-[#333333]">
            {/* Preview button */}
            <Tooltip text="Preview">
              <button
                onClick={handlePreview}
                className="w-[36px] h-[32px] flex items-center justify-center bg-transparent hover:bg-[#1c1c1c] text-[#777777] hover:text-white transition-colors rounded-l-lg"
              >
                <ExternalLink className="w-[14px] h-[14px] stroke-[1.8]" />
              </button>
            </Tooltip>

            {/* Copy link button */}
            <Tooltip text={copied ? 'Copied!' : 'Copy link to event'}>
              <button
                onClick={handleCopy}
                className="w-[36px] h-[32px] flex items-center justify-center bg-transparent hover:bg-[#1c1c1c] text-[#777777] hover:text-white transition-colors"
              >
                <LinkIcon />
              </button>
            </Tooltip>

            {/* Three dot menu */}
            <Tooltip text="More">
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-[36px] h-[32px] flex items-center justify-center bg-transparent hover:bg-[#1c1c1c] text-[#777777] hover:text-white transition-colors rounded-r-lg"
                >
                  <MoreHorizontal className="w-[15px] h-[15px] stroke-[2.5]" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-10 z-20 w-44 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl py-1 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(eventType);
                        }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-[#cccccc] hover:bg-[#252525] hover:text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <div className="border-t border-[#2a2a2a]" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(eventType.id);
                        }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[13px] text-red-400 hover:bg-[#252525] hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}