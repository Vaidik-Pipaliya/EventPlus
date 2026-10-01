import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    index: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  remindBefore: {
    type: String,
    enum: ['1h', '1d', '1w'],
    default: '1d'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce one reminder setting per user per event
reminderSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Reminder = mongoose.model('Reminder', reminderSchema);
