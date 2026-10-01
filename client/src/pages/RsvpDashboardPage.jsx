import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Bell, Trash2, Share2, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client.js';
import { Button } from '../components/ui/Button.jsx';
import { ShareLinkModal } from '../components/events/ShareLinkModal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export const RsvpDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [dashboardData, setDashboardData] = useState({ upcoming: [], past: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [activeShareEvent, setActiveShareEvent] = useState(null);
  const { showToast } = useToast();

  const fetchRsvps = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/rsvps');
      setDashboardData(res.data?.data || { upcoming: [], past: [], all: [] });
    } catch (err) {
      showToast('Failed to load RSVPs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRsvps();
  }, []);

  const handleCancelRsvp = async (eventId, title) => {
    if (!window.confirm(`Are you sure you want to cancel your RSVP for "${title}"?`)) return;
    try {
      await apiClient.delete(`/api/rsvps/${eventId}`);
      showToast('RSVP cancelled successfully');
      fetchRsvps();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not cancel RSVP', 'error');
    }
  };

  const handleReminderChange = async (eventId, enabled, remindBefore) => {
    try {
      await apiClient.put(`/api/reminders/${eventId}`, { enabled, remindBefore });
      showToast(`Reminder updated: ${remindBefore} before event`);
      // Update local state
      setDashboardData((prev) => {
        const updateList = (list) =>
          list.map((item) =>
            item.eventId === eventId
              ? { ...item, reminder: { enabled, remindBefore } }
              : item
          );
        return {
          upcoming: updateList(prev.upcoming),
          past: updateList(prev.past),
          all: updateList(prev.all)
        };
      });
    } catch (err) {
      showToast('Failed to update reminder settings', 'error');
    }
  };

  const currentList = activeTab === 'upcoming' ? dashboardData.upcoming : dashboardData.past;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-app-border mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-app-text">
            My RSVPs & Attendance
          </h1>
          <p className="text-xs text-app-text-muted mt-1">
            Manage your confirmed events, customize notification reminders, and share invite links.
          </p>
        </div>
        <Link to="/">
          <Button variant="secondary" size="sm">
            Browse more events
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-app-border mb-6">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-xs font-semibold tracking-wide transition-colors relative ${
            activeTab === 'upcoming'
              ? 'text-app-primary'
              : 'text-app-text-muted hover:text-app-text'
          }`}
        >
          Upcoming ({dashboardData.upcoming.length})
          {activeTab === 'upcoming' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-app-primary" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-xs font-semibold tracking-wide transition-colors relative ${
            activeTab === 'past'
              ? 'text-app-primary'
              : 'text-app-text-muted hover:text-app-text'
          }`}
        >
          Past ({dashboardData.past.length})
          {activeTab === 'past' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-app-primary" />
          )}
        </button>
      </div>

      {/* List content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} RSVPs`}
          description={
            activeTab === 'upcoming'
              ? "You haven't confirmed attendance to any upcoming events yet."
              : "You have no past event history."
          }
          actionText="Browse events"
          onAction={() => (window.location.href = '/')}
        />
      ) : (
        <div className="bg-app-surface border border-app-border rounded-card overflow-hidden">
          <div className="divide-y divide-app-border">
            {currentList.map((rsvp) => {
              const event = rsvp.event || {};
              const reminder = rsvp.reminder || { enabled: false, remindBefore: '1d' };

              return (
                <div
                  key={rsvp._id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-app-surface-muted/40 transition-colors"
                >
                  {/* Event Details */}
                  <div className="flex items-start gap-4">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-16 h-16 rounded-input object-cover border border-app-border shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-input bg-app-surface-muted flex items-center justify-center text-app-text-muted shrink-0">
                        <Calendar className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-app-text">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-app-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.startDateTime ? event.startDateTime.split('T')[0] : 'Date TBA'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.venue || 'Venue TBA'}{event.city ? ` · ${event.city}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reminder setting + Share + Cancel */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0">
                    {/* Reminder selector */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-app-surface-muted rounded-input border border-app-border">
                      <Bell className={`w-3.5 h-3.5 ${reminder.enabled ? 'text-app-warning' : 'text-app-text-muted'}`} />
                      <select
                        value={reminder.enabled ? reminder.remindBefore : 'disabled'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'disabled') {
                            handleReminderChange(rsvp.eventId, false, '1d');
                          } else {
                            handleReminderChange(rsvp.eventId, true, val);
                          }
                        }}
                        className="text-xs bg-transparent text-app-text focus:outline-none cursor-pointer"
                      >
                        <option value="disabled">Reminder Off</option>
                        <option value="1h">1 hour before</option>
                        <option value="1d">1 day before</option>
                        <option value="1w">1 week before</option>
                      </select>
                    </div>

                    {/* Share Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setActiveShareEvent({ id: rsvp.eventId, title: event.title })}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </Button>

                    {/* Cancel RSVP */}
                    <button
                      onClick={() => handleCancelRsvp(rsvp.eventId, event.title)}
                      className="p-2 text-app-text-muted hover:text-app-danger rounded-input hover:bg-red-50 transition-colors"
                      title="Cancel RSVP"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {activeShareEvent && (
        <ShareLinkModal
          isOpen={Boolean(activeShareEvent)}
          onClose={() => setActiveShareEvent(null)}
          eventId={activeShareEvent.id}
          eventTitle={activeShareEvent.title}
        />
      )}
    </div>
  );
};
