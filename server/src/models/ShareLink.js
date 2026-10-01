import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const shareLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => nanoid(10)
  },
  eventId: {
    type: String,
    required: true,
    index: true
  },
  sharerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Idempotent: one share link per user per event
shareLinkSchema.index({ eventId: 1, sharerId: 1 }, { unique: true });

export const ShareLink = mongoose.model('ShareLink', shareLinkSchema);
