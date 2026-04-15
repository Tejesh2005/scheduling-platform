// FILE: src/components/UI/Tooltip.jsx

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ text, children, className = '' }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
    }
  }, [show]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none flex flex-col items-center"
            style={{
              top: `${coords.top - 40}px`,
              left: `${coords.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-white text-[#0a0a0a] text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
              {text}
            </div>
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid white',
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}