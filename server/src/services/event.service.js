import { fetchTicketmasterEvents, fetchTicketmasterEventById } from './ticketmaster.service.js';
import { Rsvp } from '../models/Rsvp.js';
import { ShareLink } from '../models/ShareLink.js';
import { ShareClick } from '../models/ShareClick.js';
import { getMonthRange } from '../utils/dates.js';

/**
 * Enrich a list of normalized events with current user's RSVP status and Friends Attending count.
 * Uses batch queries to eliminate N+1 database roundtrips.
 */
export const enrichEvents = async (events, userId = null) => {
  if (!events || events.length === 0) return [];
  if (!userId) {
    return events.map(e => ({
      ...e,
      rsvped: false,
      friendsAttending: 0
    }));
  }

  const eventIds = events.map(e => e.id);

  // 1. Batch query user's active RSVPs
  const activeRsvps = await Rsvp.find({
    userId,
    eventId: { $in: eventIds },
    status: 'going'
  }).select('eventId').lean();
  const rsvpedSet = new Set(activeRsvps.map(r => r.eventId));

  // 2. Batch query sharer's ShareLinks for these events
  const shareLinks = await ShareLink.find({
    sharerId: userId,
    eventId: { $in: eventIds }
  }).select('_id eventId').lean();

  const shareLinkIdToEventId = new Map();
  const shareLinkIds = [];
  shareLinks.forEach(link => {
    shareLinkIdToEventId.set(link._id.toString(), link.eventId);
    shareLinkIds.push(link._id);
  });

  // 3. Batch aggregate unique clicks for these share links
  const friendsAttendingMap = new Map();
  if (shareLinkIds.length > 0) {
    const clickCounts = await ShareClick.aggregate([
      { $match: { shareLinkId: { $in: shareLinkIds } } },
      { $group: { _id: '$shareLinkId', count: { $sum: 1 } } }
    ]);

    clickCounts.forEach(c => {
      const eventId = shareLinkIdToEventId.get(c._id.toString());
      if (eventId) {
        friendsAttendingMap.set(eventId, (friendsAttendingMap.get(eventId) || 0) + c.count);
      }
    });
  }

  // 4. Return enriched events
  return events.map(event => ({
    ...event,
    rsvped: rsvpedSet.has(event.id),
    friendsAttending: friendsAttendingMap.get(event.id) || 0
  }));
};

/**
 * Search events with filters, pagination, and user enrichment
 */
export const getEvents = async (params = {}, userId = null) => {
  const events = await fetchTicketmasterEvents(params);
  return await enrichEvents(events, userId);
};

/**
 * Get single event by ID with enrichment
 */
export const getEventById = async (id, userId = null) => {
  const event = await fetchTicketmasterEventById(id);
  const enriched = await enrichEvents([event], userId);
  return enriched[0];
};

/**
 * Calendar density aggregation: returns { "YYYY-MM-DD": count } for a given month & city
 */
export const getCalendarData = async ({ month, city }) => {
  const { startDateTime, endDateTime } = getMonthRange(month);

  const events = await fetchTicketmasterEvents({
    city,
    from: startDateTime,
    to: endDateTime,
    size: 100
  });

  const countsByDate = {};
  events.forEach(e => {
    if (e.date) {
      countsByDate[e.date] = (countsByDate[e.date] || 0) + 1;
    }
  });

  return countsByDate;
};
