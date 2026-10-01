import { Router } from 'express';
import * as reminderController from '../controllers/reminder.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateReminderSchema } from '../validators/rsvp.validator.js';

const router = Router();

router.use(requireAuth);

router.put('/:eventId', validate(updateReminderSchema), reminderController.update);
router.get('/', reminderController.list);

export default router;
