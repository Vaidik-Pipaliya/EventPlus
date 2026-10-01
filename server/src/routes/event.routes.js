import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getEventsQuerySchema, getCalendarQuerySchema } from '../validators/event.validator.js';

const router = Router();

router.get('/calendar', validate(getCalendarQuerySchema, 'query'), eventController.getCalendar);
router.get('/:id', optionalAuth, eventController.getEventDetail);
router.get('/', optionalAuth, validate(getEventsQuerySchema, 'query'), eventController.listEvents);

export default router;
