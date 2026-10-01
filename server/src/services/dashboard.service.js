import mongoose from 'mongoose';
import { Rsvp } from '../models/Rsvp.js';
import { Reminder } from '../models/Reminder.js';
import { ShareLink } from '../models/ShareLink.js';
import { ShareClick } from '../models/ShareClick.js';
import { fetchTicketmasterEventById } from './ticketmaster.service.js';

/**
 * Compute aggregate dashboard stats for an authenticated user
 * All metrics strictly count active RSVPs and user-owned links
 */
export const getDashboardStats = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const nowISO = now.toISOString();

  // 1. Totals
  const [rsvps, upcoming, remindersSet] = await Promise.all([
    Rsvp.countDocuments({ userId: userObjectId, status: 'going' }),
    Rsvp.countDocuments({
      userId: userObjectId,
      status: 'going',
      'event.startDateTime': { $gte: nowISO }
    }),
    Reminder.countDocuments({ userId: userObjectId, enabled: true })
  ]);

  // Unique clicks on all share links created by this user
  const userLinks = await ShareLink.find({ sharerId: userObjectId }).select('_id');
  const shareLinkIds = userLinks.map((l) => l._id);
  const friendsReached = shareLinkIds.length > 0
    ? await ShareClick.countDocuments({ shareLinkId: { $in: shareLinkIds } })
    : 0;

  const totals = {
    rsvps,
    upcoming,
    friendsReached,
    remindersSet
  };

  // 2. RSVPs by month (last 6 months, zero-filled, chronological)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    months.push(`${yyyy}-${mm}`);
  }
  const earliestDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const monthlyAgg = await Rsvp.aggregate([
    {
      $match: {
        userId: userObjectId,
        status: 'going',
        createdAt: { $gte: earliestDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    }
  ]);

  const countMap = {};
  for (const row of monthlyAgg) {
    countMap[row._id] = row.count;
  }

  const rsvpsByMonth = months.map((m) => ({
    month: m,
    count: countMap[m] || 0
  }));

  // 3. Events by category (only active RSVPs)
  const eventsByCategory = await Rsvp.aggregate([
    {
      $match: {
        userId: userObjectId,
        status: 'going'
      }
    },
    {
      $group: {
        _id: { $ifNull: ['$event.category', 'Other'] },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1
      }
    },
    {
      $sort: { count: -1, category: 1 }
    }
  ]);

  // 4. Invite reach (top 5 events by unique clicks)
  const inviteReachAgg = await ShareLink.aggregate([
    {
      $match: {
        sharerId: userObjectId
      }
    },
    {
      $lookup: {
        from: 'shareclicks',
        localField: '_id',
        foreignField: 'shareLinkId',
        as: 'clicks'
      }
    },
    {
      $lookup: {
        from: 'rsvps',
        let: { eid: '$eventId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', userObjectId] },
                  { $eq: ['$eventId', '$$eid'] }
                ]
              }
            }
          }
        ],
        as: 'userRsvp'
      }
    },
    {
      $project: {
        _id: 0,
        eventId: 1,
        uniqueClicks: { $size: '$clicks' },
        title: {
          $ifNull: [
            { $arrayElemAt: ['$userRsvp.event.title', 0] },
            ''
          ]
        }
      }
    },
    {
      $sort: { uniqueClicks: -1, eventId: 1 }
    },
    {
      $limit: 5
    }
  ]);

  const inviteReach = await Promise.all(
    inviteReachAgg.map(async (item) => {
      let title = item.title;
      if (!title || title === item.eventId) {
        try {
          const ev = await fetchTicketmasterEventById(item.eventId);
          if (ev?.title) title = ev.title;
        } catch (_) {}
      }
      return {
        eventId: item.eventId,
        title: title || item.eventId,
        uniqueClicks: item.uniqueClicks || 0
      };
    })
  );

  return {
    totals,
    rsvpsByMonth,
    eventsByCategory,
    inviteReach
  };
};
