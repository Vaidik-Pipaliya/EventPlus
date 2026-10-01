import mongoose from 'mongoose';

const shareClickSchema = new mongoose.Schema({
  shareLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShareLink',
    required: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    index: true
  },
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  visitorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  firstClickedAt: {
    type: Date,
    default: Date.now
  },
  clickCount: {
    type: Number,
    default: 1
  }
});

// Enforce uniqueness per visitor per share link
shareClickSchema.index({ shareLinkId: 1, visitorId: 1 }, { unique: true });

export const ShareClick = mongoose.model('ShareClick', shareClickSchema);
