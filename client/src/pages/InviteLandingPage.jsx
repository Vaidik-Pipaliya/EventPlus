import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export const InviteLandingPage = () => {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [hasRsvped, setHasRsvped] = useState(false);

  useEffect(() => {
    const recordClickAndLoadEvent = async () => {
      try {
        setLoading(true);
        // GET /api/share/:token/click records the unique visitor click and returns event + sharer info
        const res = await apiClient.get(`/api/share/${token}/click`);
        setData(res.data?.data || null);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'This invite link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    recordClickAndLoadEvent();
  }, [token]);

  const handleRsvp = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/invite/${token}` } } });
      return;
    }

    if (!data?.event?.id) return;

    try {
      setRsvpLoading(true);
      await apiClient.post('/api/rsvps', { eventId: data.event.id });
      setHasRsvped(true);
      showToast("RSVP confirmed! You're attending this event.");
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to RSVP', 'error');
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-xs text-app-text-muted flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-app-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-app-surface border border-app-border rounded-card text-center space-y-4">
        <h2 className="text-lg font-semibold text-app-text">Invite Not Found</h2>
        <p className="text-xs text-app-text-muted">{error}</p>
        <Link to="/">
          <Button variant="primary" size="sm">
            Browse Events
          </Button>
        </Link>
      </div>
    );
  }

  const { event, sharer, uniqueClicks } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-left">
      <div className="bg-app-surface border border-app-border rounded-card overflow-hidden shadow-none">
        {/* Banner with Sharer info */}
        <div className="p-4 bg-app-primary-soft border-b border-app-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-app-primary text-white font-semibold text-xs flex items-center justify-center">
              {sharer?.name?.[0]?.toUpperCase() || 'F'}
            </div>
            <div>
              <p className="text-xs font-semibold text-app-primary">
                Invited by {sharer?.name || 'a friend'}
              </p>
              <p className="text-[11px] text-app-text-muted">
                Join them at this event via EventPulse
              </p>
            </div>
          </div>

          <Badge variant="primary" className="bg-white/80">
            <Users className="w-3 h-3 text-app-primary" />
            <span>{uniqueClicks} {uniqueClicks === 1 ? 'friend' : 'friends'} viewed</span>
          </Badge>
        </div>

        {/* Event Image */}
        {event?.imageUrl && (
          <div className="relative aspect-[16/9] w-full bg-app-surface-muted overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Event Details */}
        <div className="p-6 space-y-4">
          <h1 className="text-xl font-bold text-app-text leading-tight">
            {event?.title}
          </h1>

          <div className="space-y-2 text-xs text-app-text-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-app-primary shrink-0" />
              <span className="font-medium text-app-text">
                {event?.date || 'Date TBA'} {event?.time ? `at ${event.time}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-app-primary shrink-0" />
              <span>
                {event?.venue || 'Venue TBA'}{event?.city ? `, ${event.city}` : ''}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-app-border flex flex-col sm:flex-row items-center gap-3">
            {hasRsvped ? (
              <div className="w-full py-2.5 px-4 bg-app-success-soft text-app-success rounded-input text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>You're Going to this Event!</span>
              </div>
            ) : isAuthenticated ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto flex-1 font-semibold"
                onClick={handleRsvp}
                loading={rsvpLoading}
              >
                RSVP — I'm Attending
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto flex-1 font-semibold"
                onClick={handleRsvp}
              >
                Sign in to RSVP
              </Button>
            )}

            {event?.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="secondary" size="lg" className="w-full gap-1.5 text-xs">
                  <span>Ticket Info</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
