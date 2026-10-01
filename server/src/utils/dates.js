/**
 * Date helper utilities for Ticketmaster queries, calendar grouping, and intent parsing.
 */

export const formatDateToISO = (date) => {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

/**
 * Get start and end of day in UTC
 */
export const getDayRange = (targetDate = new Date()) => {
  const start = new Date(targetDate);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(targetDate);
  end.setUTCHours(23, 59, 59, 999);

  return {
    startDateTime: formatDateToISO(start),
    endDateTime: formatDateToISO(end)
  };
};

/**
 * Get upcoming/this weekend range (Friday 18:00 to Sunday 23:59)
 */
export const getThisWeekendRange = () => {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday

  const friday = new Date(now);
  if (currentDay <= 5) {
    friday.setUTCDate(now.getUTCDate() + (5 - currentDay));
  } else {
    // Already Saturday or Sunday; use this weekend
    friday.setUTCDate(now.getUTCDate() - (currentDay - 5));
  }
  friday.setUTCHours(18, 0, 0, 0);

  const sunday = new Date(friday);
  sunday.setUTCDate(friday.getUTCDate() + 2);
  sunday.setUTCHours(23, 59, 59, 999);

  return {
    startDateTime: formatDateToISO(friday),
    endDateTime: formatDateToISO(sunday)
  };
};

/**
 * Get month date range for calendar (from YYYY-MM)
 */
export const getMonthRange = (yearMonthStr) => {
  let [year, month] = (yearMonthStr || '').split('-').map(Number);
  const now = new Date();

  if (!year || !month || month < 1 || month > 12) {
    year = now.getUTCFullYear();
    month = now.getUTCMonth() + 1;
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return {
    startDateTime: formatDateToISO(start),
    endDateTime: formatDateToISO(end),
    year,
    month
  };
};
