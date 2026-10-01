import { Router } from 'express';
import * as rsvpController from '../controllers/rsvp.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createRsvpSchema } from '../validators/rsvp.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createRsvpSchema), rsvpController.create);
router.delete('/:eventId', rsvpController.cancel);
router.get('/', rsvpController.list);

export default router;
