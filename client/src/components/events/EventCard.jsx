import React, { useState } from 'react';
import { Calendar, MapPin, Users, Check, Share2, Clock } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const EventCard = ({
  event,
  onRsvpToggle,
  onShare,
  isRsvpLoading = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const {
    id,
    title,
    venue,
    city,
    date,
    time,
    imageUrl,
    rsvped = false,
    friendsAttending = 0
  } = event;

  // Format date display (e.g. Sat, 12 Oct · 7:30 PM)
  const formatEventDateTime = () => {
    if (!date) return '';
    try {
      const d = new Date(date + (time ? `T${time}` : 'T00:00:00'));
      const datePart = d.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      const timePart = time
        ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : '';
      return timePart ? `${datePart} · ${timePart}` : datePart;
    } catch {
      return date;
    }
  };

  return (
    <div className="bg-app-surface border border-app-border rounded-card overflow-hidden flex flex-col transition-all duration-150 hover:border-slate-300 text-left">
      {/* 16:9 Event Image with neutral fallback placeholder */}
      <div className="relative aspect-[16/9] w-full bg-app-surface-muted overflow-hidden">
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-app-text-muted/40">
            <Calendar className="w-8 h-8 stroke-1" />
          </div>
        )}

        {/* Friends Attending Badge Overlay */}
        {friendsAttending > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="primary" className="shadow-none backdrop-blur-sm bg-app-primary-soft/95 text-app-primary font-medium">
              <Users className="w-3 h-3" />
              <span>{friendsAttending} friend{friendsAttending > 1 ? 's' : ''} attending</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title clamped to 2 lines */}
          <h3 className="text-base font-semibold text-app-text line-clamp-2 leading-snug mb-2" title={title}>
            {title}
          </h3>

          {/* Venue & City */}
          <div className="flex items-center gap-1.5 text-xs text-app-text-muted mb-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-app-text-muted/80" />
            <span className="truncate">{venue}{city ? ` · ${city}` : ''}</span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-xs text-app-text-muted mb-4">
            <Clock className="w-3.5 h-3.5 shrink-0 text-app-text-muted/80" />
            <span>{formatEventDateTime()}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-app-border/60 flex items-center justify-between gap-2 mt-auto">
          {/* Interested / Going Button */}
          {rsvped ? (
            <Button
              variant="success"
              size="sm"
              className="flex-1 gap-1.5 font-medium"
              onClick={() => onRsvpToggle && onRsvpToggle(id, false)}
              loading={isRsvpLoading}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Going</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onRsvpToggle && onRsvpToggle(id, true)}
              loading={isRsvpLoading}
            >
              Interested
            </Button>
          )}

          {/* Share Button (appears only after RSVP) */}
          {rsvped && onShare && (
            <Button
              variant="secondary"
              size="sm"
              className="px-2.5 text-app-text-muted hover:text-app-text"
              onClick={() => onShare(id, title)}
              title="Share with friends"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Share</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
