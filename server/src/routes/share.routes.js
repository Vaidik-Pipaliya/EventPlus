import { Router } from 'express';
import * as shareController from '../controllers/share.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { shareEventParamSchema, shareTokenParamSchema } from '../validators/share.validator.js';

const router = Router();

router.post('/:eventId', requireAuth, validate(shareEventParamSchema, 'params'), shareController.createShareLink);
router.get('/:token/click', optionalAuth, validate(shareTokenParamSchema, 'params'), shareController.recordClick);
router.get('/:eventId/stats', requireAuth, validate(shareEventParamSchema, 'params'), shareController.getStats);

export default router;
