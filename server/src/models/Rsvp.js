import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['going', 'cancelled'],
    default: 'going'
  },
  event: {
    title: { type: String, required: true },
    venue: { type: String, default: 'Venue TBA' },
    startDateTime: { type: String, required: true },
    url: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    city: { type: String, default: '' }
  }
}, {
  timestamps: true
});

// Enforce one RSVP state per user per event
rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Rsvp = mongoose.model('Rsvp', rsvpSchema);
