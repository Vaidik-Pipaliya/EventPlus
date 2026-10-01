import React, { useState, useEffect } from 'react';
import { Search, MapPin, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EventCard } from '../components/events/EventCard.jsx';
import { EventCalendar } from '../components/events/EventCalendar.jsx';
import { ShareLinkModal } from '../components/events/ShareLinkModal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export const EventsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [events, setEvents] = useState([]);
  const [calendarMap, setCalendarMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(user?.city || 'Mumbai');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // Share modal state
  const [activeShareEvent, setActiveShareEvent] = useState(null);
  const [rsvpPendingId, setRsvpPendingId] = useState(null);

  // Sync city with user profile if user loads
  useEffect(() => {
    if (user?.city && !selectedCity) {
      setSelectedCity(user.city);
    }
  }, [user]);

  // Fetch calendar density data
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await apiClient.get('/api/events/calendar', {
          params: { month: selectedMonth, city: selectedCity }
        });
        setCalendarMap(res.data?.data || {});
      } catch (err) {
        console.warn('Failed to load calendar density:', err);
      }
    };
    fetchCalendar();
  }, [selectedMonth, selectedCity]);

  // Fetch events
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        city: selectedCity || undefined,
        q: searchQuery.trim() || undefined
      };

      if (selectedDate) {
        params.from = `${selectedDate}T00:00:00Z`;
        params.to = `${selectedDate}T23:59:59Z`;
      }

      const res = await apiClient.get('/api/events', { params });
      setEvents(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedCity, selectedDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadEvents();
  };

  // RSVP toggle handler
  const handleRsvpToggle = async (eventId, shouldRsvp) => {
    if (!isAuthenticated) {
      showToast('Please sign in to RSVP to events', 'info');
      window.location.href = '/login';
      return;
    }

    setRsvpPendingId(eventId);
    const previousEvents = [...events];

    // Optimistic UI update
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, rsvped: shouldRsvp } : e))
    );

    try {
      if (shouldRsvp) {
        await apiClient.post('/api/rsvps', { eventId });
        showToast('RSVP confirmed! Click "Share" to invite friends.');
      } else {
        await apiClient.delete(`/api/rsvps/${eventId}`);
        showToast('RSVP cancelled');
      }
    } catch (err) {
      // Rollback on failure
      setEvents(previousEvents);
      showToast(err.response?.data?.error?.message || 'Could not update RSVP', 'error');
    } finally {
      setRsvpPendingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-app-border text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-app-text">
            Discover Events
          </h1>
          <p className="text-xs text-app-text-muted mt-1">
            Browse upcoming concerts, conferences, and meetups in real-time.
          </p>
        </div>

        {/* Search & City Filter */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Keyword Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-app-surface border border-app-border rounded-input text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary"
            />
          </div>

          {/* City Selector */}
          <div className="relative sm:w-44">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-xs bg-app-surface border border-app-border rounded-input text-app-text focus:outline-none focus:border-app-primary appearance-none cursor-pointer"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Delhi">Delhi</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="London">London</option>
              <option value="New York">New York</option>
              <option value="San Francisco">San Francisco</option>
            </select>
          </div>

          <button
            type="submit"
            className="h-10 px-4 bg-app-primary text-white text-xs font-medium rounded-input hover:bg-app-primary-hover transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Main Grid: Sidebar + Event Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Calendar & Date Filter (Desktop 4 cols) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="text-left">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-app-text-muted mb-2">
              Filter by Date
            </h2>
            <EventCalendar
              densityMap={calendarMap}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
              onMonthChange={(m) => setSelectedMonth(m)}
            />
          </div>

          {/* Quick Info Box */}
          <div className="p-4 bg-app-surface border border-app-border rounded-card text-left text-xs space-y-2">
            <div className="font-semibold text-app-text flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-app-primary" />
              <span>How Social RSVP Works</span>
            </div>
            <p className="text-app-text-muted leading-relaxed">
              RSVP to any event to unlock your private <strong>Friend Invite</strong> link.
              Whenever a friend opens your link, your event card displays a live <strong>"Friends Attending"</strong> count!
            </p>
          </div>
        </aside>

        {/* Right Area: Event Cards (8 cols) */}
        <main className="lg:col-span-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-app-surface border border-app-border rounded-card p-4 space-y-3">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full mt-4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-app-surface border border-app-border rounded-card space-y-3">
              <p className="text-xs text-app-danger">{error}</p>
              <button
                onClick={loadEvents}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-app-surface-muted text-xs font-medium rounded-input hover:bg-app-border text-app-text"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title={selectedDate ? `No events found for ${selectedDate}` : `No events found in ${selectedCity}`}
              description="Try selecting a different date from the calendar or changing the city filter above."
              actionText="Reset date filter"
              onAction={() => setSelectedDate(null)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRsvpToggle={handleRsvpToggle}
                  onShare={(id, title) => setActiveShareEvent({ id, title })}
                  isRsvpLoading={rsvpPendingId === event.id}
                />
              ))}
            </div>
          )}
        </main>
      </div>

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
