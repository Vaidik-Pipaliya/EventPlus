import { Rsvp } from '../models/Rsvp.js';
import { Reminder } from '../models/Reminder.js';
import { fetchTicketmasterEventById } from './ticketmaster.service.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Idempotently create or reactivate an RSVP with event snapshot
 */
export const createRsvp = async (userId, eventId, io = null) => {
  const event = await fetchTicketmasterEventById(eventId);
  if (!event) {
    throw new AppError('EVENT_NOT_FOUND', 'Event not found to RSVP', 404);
  }

  const snapshot = {
    title: event.title,
    category: event.category || 'Other',
    venue: event.venue,
    startDateTime: event.startDateTime,
    url: event.url,
    imageUrl: event.imageUrl,
    city: event.city
  };

  const rsvp = await Rsvp.findOneAndUpdate(
    { userId, eventId },
    {
      $set: {
        status: 'going',
        event: snapshot
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Sync across open tabs via user-specific socket room
  if (io) {
    io.to(`user_${userId}`).emit('rsvp:updated', {
      eventId,
      status: 'going',
      rsvp
    });
  }

  return rsvp;
};

/**
 * Cancel an active RSVP
 */
export const cancelRsvp = async (userId, eventId, io = null) => {
  const rsvp = await Rsvp.findOneAndUpdate(
    { userId, eventId },
    { $set: { status: 'cancelled' } },
    { new: true }
  );

  if (!rsvp) {
    throw new AppError('RSVP_NOT_FOUND', 'RSVP does not exist', 404);
  }

  // Also disable reminder if active
  await Reminder.findOneAndUpdate(
    { userId, eventId },
    { $set: { enabled: false } }
  );

  if (io) {
    io.to(`user_${userId}`).emit('rsvp:updated', {
      eventId,
      status: 'cancelled',
      rsvp
    });
  }

  return rsvp;
};

/**
 * Get all active RSVPs for user, divided into upcoming and past, enriched with reminder settings
 */
export const getUserRsvps = async (userId) => {
  const rsvps = await Rsvp.find({ userId, status: 'going' })
    .sort({ 'event.startDateTime': 1 })
    .lean();

  const eventIds = rsvps.map(r => r.eventId);
  const reminders = await Reminder.find({
    userId,
    eventId: { $in: eventIds }
  }).lean();

  const reminderMap = new Map();
  reminders.forEach(r => reminderMap.set(r.eventId, r));

  const now = new Date().toISOString();
  const enriched = rsvps.map(r => ({
    ...r,
    id: r._id.toString(),
    reminder: reminderMap.get(r.eventId) || {
      enabled: false,
      remindBefore: '1d'
    }
  }));

  const upcoming = enriched.filter(r => r.event?.startDateTime >= now);
  const past = enriched.filter(r => r.event?.startDateTime < now);

  return {
    upcoming,
    past,
    all: enriched,
    total: enriched.length
  };
};

/**
 * Verify whether a user has an active RSVP
 */
export const hasActiveRsvp = async (userId, eventId) => {
  const rsvp = await Rsvp.findOne({ userId, eventId, status: 'going' });
  return !!rsvp;
};
