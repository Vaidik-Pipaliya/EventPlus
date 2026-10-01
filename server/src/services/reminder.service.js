import { Reminder } from '../models/Reminder.js';
import { Rsvp } from '../models/Rsvp.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Set or update reminder preferences for an RSVP'd event
 */
export const setReminder = async (userId, eventId, { enabled = true, remindBefore = '1d' }) => {
  // Check that user has active RSVP for event
  const rsvp = await Rsvp.findOne({ userId, eventId, status: 'going' });
  if (!rsvp) {
    throw new AppError('RSVP_REQUIRED', 'You must RSVP to this event before setting a reminder', 400);
  }

  const reminder = await Reminder.findOneAndUpdate(
    { userId, eventId },
    { $set: { enabled, remindBefore } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return reminder;
};

/**
 * Get all reminders for a user
 */
export const getUserReminders = async (userId) => {
  return await Reminder.find({ userId }).sort({ createdAt: -1 });
};
