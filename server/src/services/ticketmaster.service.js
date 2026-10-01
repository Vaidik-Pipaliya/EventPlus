import axios from 'axios';
import { env } from '../config/env.js';
import { eventCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const TM_API_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

/**
 * High quality curated fallback events for offline resilience or missing API key
 */
const FALLBACK_EVENTS = [
  {
    id: 'tm_fallback_001',
    title: 'A.R. Rahman Live in Concert — Symphony of Peace',
    venue: 'DY Patil Stadium',
    city: 'Mumbai',
    date: '2026-10-10',
    time: '19:00:00',
    startDateTime: '2026-10-10T13:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.ticketmaster.com'
  },
  {
    id: 'tm_fallback_002',
    title: 'International Tech & AI Innovators Summit 2026',
    venue: 'Jio World Convention Centre',
    city: 'Mumbai',
    date: '2026-10-11',
    time: '09:30:00',
    startDateTime: '2026-10-11T04:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.ticketmaster.com'
  },
  {
    id: 'tm_fallback_003',
    title: 'Coldplay — Music of the Spheres World Tour',
    venue: 'Narendra Modi Stadium',
    city: 'Ahmedabad',
    date: '2026-10-17',
    time: '18:30:00',
    startDateTime: '2026-10-17T13:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.ticketmaster.com'
  },
  {
    id: 'tm_fallback_004',
    title: 'Zakir Khan — Tathastu Live Comedy Special',
    venue: 'NCPA Tata Theatre',
    city: 'Mumbai',
    date: '2026-10-18',
    time: '20:00:00',
    startDateTime: '2026-10-18T14:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.ticketmaster.com'
  },
  {
    id: 'tm_fallback_005',
    title: 'Sunburn Arena Electronic Music Festival',
    venue: 'Mahalaxmi Race Course',
    city: 'Mumbai',
    date: '2026-10-24',
    time: '16:00:00',
    startDateTime: '2026-10-24T10:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.ticketmaster.com'
  },
  {
    id: 'tm_fallback_006',
    title: 'Global Design & UX Leadership Conference',
    venue: 'Palace Grounds',
    city: 'Bengaluru',
    date: '2026-10-25',
    time: '10:00:00',
    startDateTime: '2026-10-25T04:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.ticketmaster.com'
  },
  {
    id: 'tm_fallback_007',
    title: 'Prateek Kuhad — Silhouettes Acoustic Tour',
    venue: 'Siri Fort Auditorium',
    city: 'Delhi',
    date: '2026-10-31',
    time: '19:30:00',
    startDateTime: '2026-10-31T14:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.ticketmaster.com'
  }
];

/**
 * Normalize Ticketmaster event object to internal Event contract
 */
export const normalizeTicketmasterEvent = (item) => {
  const venues = item._embedded?.venues || [];
  const venue = venues[0]?.name || 'Venue TBA';
  const city = venues[0]?.city?.name || venues[0]?.state?.name || 'Local';

  // Find optimal 16_9 image or highest resolution
  const images = item.images || [];
  const ratio169 = images.find(img => img.ratio === '16_9' && img.width >= 500);
  const imageUrl = ratio169?.url || images[0]?.url || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80';

  const date = item.dates?.start?.localDate || '';
  const time = item.dates?.start?.localTime || '';
  const startDateTime = item.dates?.start?.dateTime || (date ? new Date(date).toISOString() : new Date().toISOString());

  return {
    id: item.id,
    title: item.name,
    venue,
    city,
    date,
    time,
    startDateTime,
    imageUrl,
    url: item.url || ''
  };
};

/**
 * Fetch raw events from Ticketmaster with caching and fallback
 */
export const fetchTicketmasterEvents = async (params = {}) => {
  const cacheKey = JSON.stringify(params);
  const cached = eventCache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for Ticketmaster query: ${cacheKey}`);
    return cached;
  }

  if (!env.TICKETMASTER_API_KEY) {
    logger.warn('TICKETMASTER_API_KEY not set. Using curated event dataset.');
    return filterFallbackEvents(params);
  }

  try {
    const queryParams = {
      apikey: env.TICKETMASTER_API_KEY,
      keyword: params.keyword || params.q,
      city: params.city,
      startDateTime: params.from || params.startDateTime,
      endDateTime: params.to || params.endDateTime,
      size: params.size || 20,
      page: params.page ? params.page - 1 : 0, // Ticketmaster 0-indexed
      sort: 'date,asc'
    };

    // Clean undefined params
    Object.keys(queryParams).forEach(k => queryParams[k] === undefined && delete queryParams[k]);

    const response = await axios.get(TM_API_URL, {
      params: queryParams,
      timeout: 4000
    });

    const rawEvents = response.data?._embedded?.events || [];
    let normalized = rawEvents.map(normalizeTicketmasterEvent);

    // If city yielded 0 results, fall back to country or generic
    if (normalized.length === 0 && params.city) {
      logger.info(`0 results for city ${params.city}, attempting country search...`);
      const fallbackResp = await axios.get(TM_API_URL, {
        params: {
          apikey: env.TICKETMASTER_API_KEY,
          countryCode: env.DEFAULT_COUNTRY_CODE,
          size: params.size || 20,
          sort: 'date,asc'
        },
        timeout: 4000
      }).catch(() => null);

      if (fallbackResp?.data?._embedded?.events?.length) {
        normalized = fallbackResp.data._embedded.events.map(normalizeTicketmasterEvent);
      }
    }

    if (normalized.length === 0) {
      normalized = filterFallbackEvents(params);
    }

    eventCache.set(cacheKey, normalized);
    return normalized;
  } catch (err) {
    logger.error(`Ticketmaster API request failed (${err.message}). Using fallback data.`);
    const fallback = filterFallbackEvents(params);
    eventCache.set(cacheKey, fallback);
    return fallback;
  }
};

/**
 * Fetch a single event by ID
 */
export const fetchTicketmasterEventById = async (id) => {
  const cached = eventCache.get(`event_${id}`);
  if (cached) return cached;

  const fallbackMatch = FALLBACK_EVENTS.find(e => e.id === id);
  if (fallbackMatch) return fallbackMatch;

  if (!env.TICKETMASTER_API_KEY) {
    return fallbackMatch || FALLBACK_EVENTS[0];
  }

  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events/${id}.json`;
    const response = await axios.get(url, {
      params: { apikey: env.TICKETMASTER_API_KEY },
      timeout: 3500
    });

    const normalized = normalizeTicketmasterEvent(response.data);
    eventCache.set(`event_${id}`, normalized);
    return normalized;
  } catch (err) {
    logger.warn(`Failed to fetch event ${id} from Ticketmaster: ${err.message}`);
    return fallbackMatch || FALLBACK_EVENTS[0];
  }
};

/**
 * Filter fallback events in-memory by query, city, and dates
 */
const filterFallbackEvents = (params = {}) => {
  let events = [...FALLBACK_EVENTS];

  if (params.q || params.keyword) {
    const q = (params.q || params.keyword).toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q)
    );
  }

  if (params.city) {
    const city = params.city.toLowerCase();
    const cityMatches = events.filter(e => e.city.toLowerCase() === city);
    if (cityMatches.length > 0) {
      events = cityMatches;
    }
  }

  if (params.from) {
    const fromDate = new Date(params.from).getTime();
    events = events.filter(e => new Date(e.startDateTime).getTime() >= fromDate);
  }

  if (params.to) {
    const toDate = new Date(params.to).getTime();
    events = events.filter(e => new Date(e.startDateTime).getTime() <= toDate);
  }

  return events;
};
