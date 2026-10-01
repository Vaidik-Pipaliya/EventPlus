import { nanoid } from 'nanoid';
import * as shareService from '../services/share.service.js';

export const createShareLink = async (req, res, next) => {
  try {
    const result = await shareService.getOrCreateShareLink(req.user._id, req.params.eventId);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const recordClick = async (req, res, next) => {
  try {
    let visitorId = req.cookies?.visitorId;
    if (!visitorId) {
      visitorId = `v_${nanoid(16)}`;
      res.cookie('visitorId', visitorId, {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      });
    }

    const visitorUserId = req.user ? req.user._id : null;
    const result = await shareService.recordShareClick(req.params.token, visitorId, visitorUserId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await shareService.getShareStats(req.user._id, req.params.eventId);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};
