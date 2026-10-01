import * as reminderService from '../services/reminder.service.js';

export const update = async (req, res, next) => {
  try {
    const reminder = await reminderService.setReminder(
      req.user._id,
      req.params.eventId,
      req.body
    );
    res.json({ data: reminder });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const reminders = await reminderService.getUserReminders(req.user._id);
    res.json({ data: reminders });
  } catch (err) {
    next(err);
  }
};
