import React, { useState } from 'react';
import { User, Mail, MapPin, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useToast } from '../components/ui/Toast.jsx';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || 'Mumbai');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ name: name.trim(), city: city.trim() });
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    : 'Recent';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-left">
      <div className="bg-app-surface border border-app-border rounded-card p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-app-border">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border border-app-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-app-primary-soft text-app-primary font-bold text-xl flex items-center justify-center border border-app-primary/20">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-app-text">{user?.name}</h1>
              <Badge variant={user?.provider === 'google' ? 'primary' : 'default'}>
                {user?.provider === 'google' ? 'Google Account' : 'Email Account'}
              </Badge>
            </div>
            <p className="text-xs text-app-text-muted mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="name"
            label="Display Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="text-left">
            <label htmlFor="city" className="block text-xs font-medium text-app-text-muted mb-1.5">
              Default Discovery City
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none" />
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-sm bg-app-surface border border-app-border rounded-input text-app-text focus:outline-none focus:border-app-primary cursor-pointer"
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Delhi">Delhi</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="San Francisco">San Francisco</option>
              </select>
            </div>
            <p className="mt-1 text-[11px] text-app-text-muted">
              Used as the default location when finding events and searching via Assistant.
            </p>
          </div>

          {/* Account Metadata (Read-only) */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-app-surface-muted rounded-input flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-app-text-muted shrink-0" />
              <div className="truncate">
                <span className="text-[11px] text-app-text-muted block">Verified Email</span>
                <span className="font-medium text-app-text truncate">{user?.email}</span>
              </div>
            </div>

            <div className="p-3 bg-app-surface-muted rounded-input flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-app-text-muted shrink-0" />
              <div>
                <span className="text-[11px] text-app-text-muted block">Member Since</span>
                <span className="font-medium text-app-text">{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" loading={saving}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
