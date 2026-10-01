import * as eventService from '../services/event.service.js';

export const listEvents = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const events = await eventService.getEvents(req.query, userId);
    res.json({
      data: events,
      meta: {
        total: events.length,
        page: req.query.page || 1
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getCalendar = async (req, res, next) => {
  try {
    const calendar = await eventService.getCalendarData(req.query);
    res.json({ data: calendar });
  } catch (err) {
    next(err);
  }
};

export const getEventDetail = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const event = await eventService.getEventById(req.params.id, userId);
    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          details: []
        }
      });
    }
    res.json({ data: event });
  } catch (err) {
    next(err);
  }
};
