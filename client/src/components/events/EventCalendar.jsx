import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export const EventCalendar = ({
  densityMap = {},
  selectedDate = null,
  onSelectDate,
  onMonthChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const prevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    setCurrentDate(prev);
    const yStr = prev.getFullYear();
    const mStr = String(prev.getMonth() + 1).padStart(2, '0');
    if (onMonthChange) onMonthChange(`${yStr}-${mStr}`);
  };

  const nextMonth = () => {
    const next = new Date(year, month + 1, 1);
    setCurrentDate(next);
    const yStr = next.getFullYear();
    const mStr = String(next.getMonth() + 1).padStart(2, '0');
    if (onMonthChange) onMonthChange(`${yStr}-${mStr}`);
  };

  // Generate calendar days
  // Day 0 is Sunday, so for Monday start: (day + 6) % 7
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells = [];
  // Empty leading cells
  for (let i = 0; i < startingDayIndex; i++) {
    cells.push({ empty: true, key: `empty-${i}` });
  }

  // Active month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const count = densityMap[dateStr] || 0;
    const isToday = dateStr === todayStr;
    const isSelected = selectedDate === dateStr;

    cells.push({
      day: d,
      dateStr,
      count,
      isToday,
      isSelected,
      key: dateStr
    });
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-card p-4 text-left select-none">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-app-text">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded-input text-app-text-muted hover:text-app-text hover:bg-app-surface-muted transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-input text-app-text-muted hover:text-app-text hover:bg-app-surface-muted transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-[11px] font-medium text-app-text-muted py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Date cells grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((cell) => {
          if (cell.empty) {
            return <div key={cell.key} className="h-9 w-9" />;
          }

          const hasEvents = cell.count > 0;
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => {
                if (cell.isSelected) {
                  onSelectDate(null); // Toggle off
                } else {
                  onSelectDate(cell.dateStr);
                }
              }}
              className={`h-9 w-9 mx-auto rounded-input flex flex-col items-center justify-center relative text-xs transition-colors ${
                cell.isSelected
                  ? 'bg-app-primary text-white font-semibold'
                  : cell.isToday
                  ? 'border border-app-primary text-app-primary font-medium hover:bg-app-surface-muted'
                  : 'text-app-text hover:bg-app-surface-muted'
              }`}
            >
              <span>{cell.day}</span>

              {/* Event indicator dots */}
              {hasEvents && !cell.isSelected && (
                <div className="flex items-center justify-center gap-0.5 absolute bottom-1">
                  {cell.count <= 3 ? (
                    Array.from({ length: cell.count }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-app-primary"
                      />
                    ))
                  ) : (
                    <span className="text-[9px] leading-none font-bold text-app-primary">
                      +
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date filter clear */}
      {selectedDate && (
        <div className="mt-3 pt-3 border-t border-app-border flex items-center justify-between text-xs">
          <span className="text-app-text-muted truncate">
            Filtered: <strong className="text-app-text">{selectedDate}</strong>
          </span>
          <button
            onClick={() => onSelectDate(null)}
            className="inline-flex items-center gap-1 text-app-primary hover:text-app-primary-hover font-medium"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      )}
    </div>
  );
};
