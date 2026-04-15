// FILE: src/pages/PublicProfilePage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';
import { eventTypesAPI } from '../api';

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const res = await eventTypesAPI.getAll();
        setEventTypes(res.data.data.filter((et) => et.is_active));
      } catch (err) {
        console.error('Error fetching event types:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventTypes();
  }, [username]);

  const handleEventClick = (slug) => {
    navigate(`/${username}/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full mx-auto mb-4" />
          <div className="h-5 bg-[#1a1a1a] rounded w-32 mx-auto mb-8" />
          <div className="h-20 bg-[#1a1a1a] rounded w-96 mx-auto mb-3" />
          <div className="h-20 bg-[#1a1a1a] rounded w-96 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-2xl">

        {/* Back to dashboard button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[13px] text-[#898989] hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to dashboard
        </button>

        {/* Profile Card */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-6 sm:p-8 mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-700 flex items-center justify-center text-white text-xl sm:text-2xl font-semibold mb-3 lowercase">
            {username ? username[0] : 'j'}
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            {username || 'johndoe'}
          </h1>
        </div>

        {/* Event Types List */}
        {eventTypes.length === 0 ? (
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-[#555555]" />
            </div>
            <p className="text-[#898989]">No event types available.</p>
          </div>
        ) : (
          <div className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden divide-y divide-[#222222]">
            {eventTypes.map((et) => (
              <button
                key={et.id}
                onClick={() => handleEventClick(et.slug)}
                className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 hover:bg-[#161616] transition-colors group"
              >
                <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-white mb-1.5">
                  {et.title}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-[#a0a0a0] bg-[#1a1a1a] border border-[#252525] rounded-full px-2.5 py-[3px]">
                  <Clock className="w-3 h-3" />
                  {et.duration}m
                </span>
                {et.description && (
                  <p className="text-xs text-[#555555] mt-2 line-clamp-1">
                    {et.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}