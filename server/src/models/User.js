import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  firebaseUid: {
    type: String,
    sparse: true,
    index: true,
    default: null
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: 'Mumbai',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to safely return user object without password hash
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    name: this.name,
    email: this.email,
    provider: this.provider,
    avatarUrl: this.avatarUrl,
    city: this.city,
    createdAt: this.createdAt
  };
};

export const User = mongoose.model('User', userSchema);
