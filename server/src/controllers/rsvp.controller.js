import * as rsvpService from '../services/rsvp.service.js';

export const create = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const rsvp = await rsvpService.createRsvp(req.user._id, req.body.eventId, io);
    res.status(201).json({ data: rsvp });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const rsvp = await rsvpService.cancelRsvp(req.user._id, req.params.eventId, io);
    res.json({ data: rsvp });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const dashboard = await rsvpService.getUserRsvps(req.user._id);
    res.json({ data: dashboard });
  } catch (err) {
    next(err);
  }
};
