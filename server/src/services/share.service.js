import { ShareLink } from '../models/ShareLink.js';
import { ShareClick } from '../models/ShareClick.js';
import { User } from '../models/User.js';
import { hasActiveRsvp } from './rsvp.service.js';
import { fetchTicketmasterEventById } from './ticketmaster.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

/**
 * Generate or retrieve an existing share link for a user and event.
 * Enforces requirement that user must have an active RSVP.
 */
export const getOrCreateShareLink = async (sharerId, eventId) => {
  const isGoing = await hasActiveRsvp(sharerId, eventId);
  if (!isGoing) {
    throw new AppError('RSVP_REQUIRED', 'You must RSVP to this event before creating a share link', 400);
  }

  // Idempotent upsert
  let shareLink = await ShareLink.findOne({ sharerId, eventId });
  if (!shareLink) {
    shareLink = await ShareLink.create({
      sharerId,
      eventId
    });
  }

  const shareUrl = `${env.CLIENT_URL}/invite/${shareLink.token}`;
  return {
    id: shareLink._id.toString(),
    token: shareLink.token,
    eventId: shareLink.eventId,
    shareUrl
  };
};

/**
 * Record a click on a share link.
 * Dedupes by (shareLinkId, visitorId).
 * Ignores clicks made by the sharer themselves.
 */
export const recordShareClick = async (token, visitorId, visitorUserId = null) => {
  const shareLink = await ShareLink.findOne({ token }).populate('sharerId', 'name');
  if (!shareLink) {
    throw new AppError('LINK_NOT_FOUND', 'This invite link is invalid or has expired', 404);
  }

  const isSharer = visitorUserId && shareLink.sharerId && (
    visitorUserId.toString() === (shareLink.sharerId._id || shareLink.sharerId).toString()
  );

  // If visitor is not the sharer, record or increment click
  if (!isSharer && visitorId) {
    await ShareClick.findOneAndUpdate(
      { shareLinkId: shareLink._id, visitorId },
      {
        $setOnInsert: {
          shareLinkId: shareLink._id,
          eventId: shareLink.eventId,
          visitorId,
          visitorUserId: visitorUserId || null,
          firstClickedAt: new Date()
        },
        $inc: { clickCount: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Fetch unique click count for this link
  const uniqueClicks = await ShareClick.countDocuments({ shareLinkId: shareLink._id });

  // Fetch event details for the landing page
  const event = await fetchTicketmasterEventById(shareLink.eventId);

  return {
    event,
    sharer: {
      name: shareLink.sharerId?.name || 'A friend'
    },
    uniqueClicks,
    token
  };
};

/**
 * Get stats (unique clicks) for a sharer's event link
 */
export const getShareStats = async (sharerId, eventId) => {
  const shareLink = await ShareLink.findOne({ sharerId, eventId });
  if (!shareLink) {
    return {
      eventId,
      uniqueClicks: 0,
      shareUrl: null
    };
  }

  const uniqueClicks = await ShareClick.countDocuments({ shareLinkId: shareLink._id });
  return {
    eventId,
    token: shareLink.token,
    uniqueClicks,
    shareUrl: `${env.CLIENT_URL}/invite/${shareLink.token}`
  };
};
