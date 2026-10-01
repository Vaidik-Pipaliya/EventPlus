import { getEvents } from './event.service.js';
import { getUserRsvps, createRsvp } from './rsvp.service.js';
import { setReminder } from './reminder.service.js';
import { getThisWeekendRange, getDayRange } from '../utils/dates.js';

/**
 * Rule-based natural language intent parser
 */
export const parseIntent = (text) => {
  const normalized = text.toLowerCase().trim();

  // 1. HELP intent
  if (/^(help|commands|what can you do|features|options|\?)$/i.test(normalized)) {
    return { type: 'HELP' };
  }

  // 2. SHOW_RSVPS intent
  if (/(show|view|get|list|my)?\s*(rsvps?|attending|going|registered events|my schedule|my plans)/i.test(normalized)) {
    return { type: 'SHOW_RSVPS' };
  }

  // 3. SET_REMINDER intent: e.g. "remind me about Zakir Khan 1 day before"
  const reminderMatch = normalized.match(/remind\s+(?:me\s+)?(?:about\s+)?(.+?)(?:\s+(1h|1d|1w|1 hour|1 day|1 week|one day))?\s*(?:before)?$/i);
  if (reminderMatch && !normalized.startsWith('show') && !normalized.startsWith('list')) {
    const eventQuery = reminderMatch[1]?.trim();
    let remindBefore = '1d';
    const timeMatch = reminderMatch[2]?.toLowerCase();
    if (timeMatch?.includes('h')) remindBefore = '1h';
    if (timeMatch?.includes('w')) remindBefore = '1w';
    if (timeMatch?.includes('d')) remindBefore = '1d';

    if (eventQuery && eventQuery.length > 2 && !eventQuery.startsWith('me')) {
      return {
        type: 'SET_REMINDER',
        query: eventQuery,
        remindBefore
      };
    }
  }

  // 4. SEARCH_EVENTS intent: detect keywords, dates, cities
  let city = null;
  const cityMatch = normalized.match(/(?:in|at|near)\s+([a-zA-Z\s]+?)(?:\s+this|\s+today|\s+tomorrow|\s+weekend|$)/i);
  if (cityMatch && cityMatch[1]) {
    city = cityMatch[1].trim();
  }

  let dateRange = null;
  let dateDescription = '';

  if (normalized.includes('weekend')) {
    dateRange = getThisWeekendRange();
    dateDescription = 'this weekend';
  } else if (normalized.includes('today')) {
    dateRange = getDayRange(new Date());
    dateDescription = 'today';
  } else if (normalized.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    dateRange = getDayRange(tomorrow);
    dateDescription = 'tomorrow';
  }

  // Extract clean keyword query by stripping prepositions and date terms
  let query = normalized
    .replace(/(?:find|search|show|get|any|events?|concerts?|shows?|happening|in|at|near|this|today|tomorrow|weekend)/gi, '')
    .trim();

  // If input mentions events, concerts, or has city/date -> SEARCH_EVENTS
  if (
    normalized.includes('event') ||
    normalized.includes('concert') ||
    normalized.includes('show') ||
    normalized.includes('music') ||
    normalized.includes('tech') ||
    normalized.includes('comedy') ||
    normalized.includes('weekend') ||
    normalized.includes('today') ||
    city ||
    query.length > 0
  ) {
    return {
      type: 'SEARCH_EVENTS',
      query: query || undefined,
      city: city || undefined,
      dateRange,
      dateDescription
    };
  }

  return { type: 'UNKNOWN' };
};

/**
 * Handle incoming chat message, execute relevant services, and build response payload
 */
export const handleChatMessage = async (userId, text) => {
  const intent = parseIntent(text);

  switch (intent.type) {
    case 'HELP': {
      return {
        text: "I can help you discover and coordinate events in real time. Here is what you can ask:\n• \"Events this weekend\"\n• \"Concerts in Mumbai\"\n• \"Show my RSVPs\"\n• \"Remind me about Rahman 1 day before\"",
        events: []
      };
    }

    case 'SHOW_RSVPS': {
      const { upcoming, all } = await getUserRsvps(userId);
      if (upcoming.length === 0) {
        return {
          text: all.length > 0
            ? `You have no upcoming RSVPs, but ${all.length} past event(s) in your history. Browse events to RSVP!`
            : "You haven't RSVP'd to any events yet. Say 'events this weekend' to discover things to do!",
          events: []
        };
      }

      // Format RSVP event snapshots
      const events = upcoming.map(r => ({
        id: r.eventId,
        title: r.event.title,
        venue: r.event.venue,
        city: r.event.city,
        date: r.event.startDateTime ? r.event.startDateTime.split('T')[0] : '',
        time: '',
        startDateTime: r.event.startDateTime,
        imageUrl: r.event.imageUrl,
        url: r.event.url,
        rsvped: true,
        friendsAttending: 0
      }));

      return {
        text: `You have ${upcoming.length} upcoming confirmed event${upcoming.length > 1 ? 's' : ''}:`,
        events
      };
    }

    case 'SET_REMINDER': {
      const { all } = await getUserRsvps(userId);
      const match = all.find(r =>
        r.event.title.toLowerCase().includes(intent.query.toLowerCase())
      );

      if (!match) {
        return {
          text: `I couldn't find an active RSVP for "${intent.query}". Make sure you click "Interested" on the event first!`,
          events: []
        };
      }

      const reminder = await setReminder(userId, match.eventId, {
        enabled: true,
        remindBefore: intent.remindBefore
      });

      return {
        text: `Got it! Reminder set for "${match.event.title}" ${reminder.remindBefore} before start time.`,
        events: []
      };
    }

    case 'SEARCH_EVENTS': {
      const searchParams = {
        q: intent.query,
        city: intent.city,
        from: intent.dateRange?.startDateTime,
        to: intent.dateRange?.endDateTime,
        size: 5
      };

      const events = await getEvents(searchParams, userId);

      if (events.length === 0) {
        return {
          text: `No events found${intent.city ? ` in ${intent.city}` : ''}${intent.dateDescription ? ` for ${intent.dateDescription}` : ''}. Try another city or keyword!`,
          events: []
        };
      }

      const desc = intent.dateDescription ? ` ${intent.dateDescription}` : '';
      const cityDesc = intent.city ? ` in ${intent.city}` : '';
      return {
        text: `Found ${events.length} event${events.length > 1 ? 's' : ''}${cityDesc}${desc}:`,
        events
      };
    }

    case 'UNKNOWN':
    default: {
      return {
        text: "I didn't quite catch that. Try asking for \"events this weekend\", \"shows in Mumbai\", or \"show my RSVPs\".",
        events: []
      };
    }
  }
};
