/**
 * Tixora Cinematic Event Category Background Utility
 * Maps every event category to a high-resolution, visually relevant cinematic environment.
 * Ensures movie screenings show cinema halls/screens, concerts show live concert stages,
 * sports show stadiums with floodlights, comedy shows stand-up stages, etc.
 */

// Live concert hero asset (local high-res asset with stage, crowd, lighting)
const LIVE_CONCERT_HERO = '/live_concert_hero.jpg';

export const CATEGORY_CINEMATIC_BACKGROUNDS = {
  // Cinema / Movies: Grand movie theatre, velvet cinema hall, cinematic screen & projector beams
  movie: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=85',
  cinema: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=85',
  film: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=85',

  // Live Concerts: Grand live stage, massive audience, spotlights, beams & realistic crowd
  concert: LIVE_CONCERT_HERO,
  music: LIVE_CONCERT_HERO,
  'live music': LIVE_CONCERT_HERO,

  // Comedy / Stand-up: Stand-up comedy spotlight, intimate comedy club stage and audience
  comedy: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1920&q=85',
  'stand-up': 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1920&q=85',

  // Theatre / Drama: Dramatic velvet stage, theatrical spotlighting and auditorium seating
  theatre: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1920&q=85',
  drama: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1920&q=85',
  play: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1920&q=85',

  // Sports: Stadium with floodlights and roaring arena crowd
  sports: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=85',
  cricket: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1920&q=85',
  football: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1920&q=85',

  // Conferences / Summits: Premium convention hall, executive stage and modern auditorium
  conference: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1920&q=85',
  summit: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=85',

  // Festivals & Open-Air Celebrations: Festival crowd, lights, celebration
  festival: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1920&q=85',

  // DJ / Nightlife: Nightclub lasers, dance floor, electronic stage lighting
  dj: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=85',
  nightlife: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1920&q=85',

  // Cultural: Cultural performance hall, folk & traditional stage
  cultural: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1920&q=85',

  // Family & College Events: Warm entertainment venue
  family: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1920&q=85',
  'college event': 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1920&q=85',

  // Premium entertainment fallback
  default: LIVE_CONCERT_HERO,
};

/**
 * Returns the resolved cinematic background for an event or category.
 * Prioritizes the event's explicit `backgroundImage`, then checks event title/category keywords,
 * then falls back to the category mapping, guaranteeing NO generic white or mismatched backgrounds.
 *
 * @param {Object|string} eventOrCategory
 * @returns {string} URL or path of the cinematic background image
 */
export function getEventCinematicBackground(eventOrCategory) {
  if (!eventOrCategory) return CATEGORY_CINEMATIC_BACKGROUNDS.default;

  // If passed an event object
  if (typeof eventOrCategory === 'object') {
    if (eventOrCategory.backgroundImage && typeof eventOrCategory.backgroundImage === 'string') {
      if (eventOrCategory.backgroundImage.includes('1508098682722')) {
        return CATEGORY_CINEMATIC_BACKGROUNDS.sports;
      }
      return eventOrCategory.backgroundImage;
    }
    if (eventOrCategory.heroImage && typeof eventOrCategory.heroImage === 'string') {
      if (eventOrCategory.heroImage.includes('1508098682722')) {
        return CATEGORY_CINEMATIC_BACKGROUNDS.sports;
      }
      return eventOrCategory.heroImage;
    }

    const catStr = (eventOrCategory.category || '').toLowerCase();
    const titleStr = (eventOrCategory.name || eventOrCategory.title || '').toLowerCase();

    // Specific sport / sub-category detection from title & category
    if (titleStr.includes('cricket') || catStr.includes('cricket')) {
      return CATEGORY_CINEMATIC_BACKGROUNDS.cricket;
    }
    if (titleStr.includes('football') || catStr.includes('football') || titleStr.includes('soccer')) {
      return CATEGORY_CINEMATIC_BACKGROUNDS.football;
    }
    if (titleStr.includes('dj ') || titleStr.includes('night') || catStr.includes('dj') || catStr.includes('nightlife')) {
      return CATEGORY_CINEMATIC_BACKGROUNDS.dj;
    }
    if (titleStr.includes('concert') || titleStr.includes('live in') || catStr.includes('concert')) {
      return CATEGORY_CINEMATIC_BACKGROUNDS.concert;
    }
    if (titleStr.includes('comedy') || titleStr.includes('stand-up') || catStr.includes('comedy')) {
      return CATEGORY_CINEMATIC_BACKGROUNDS.comedy;
    }
    if (titleStr.includes('theatre') || titleStr.includes('drama') || catStr.includes('theatre')) {
      return CATEGORY_CINEMATIC_BACKGROUNDS.theatre;
    }
    if (titleStr.includes('movie') || titleStr.includes('cinema') || catStr.includes('movie') || catStr.includes('cinema')) {
      return CATEGORY_CINEMATIC_BACKGROUNDS.movie;
    }

    // Match by category key directly
    for (const [key, bgUrl] of Object.entries(CATEGORY_CINEMATIC_BACKGROUNDS)) {
      if (catStr.includes(key)) {
        return bgUrl;
      }
    }

    // If event has a poster image, we can use it as fallback
    if (eventOrCategory.image && typeof eventOrCategory.image === 'string') {
      return eventOrCategory.image;
    }

    return CATEGORY_CINEMATIC_BACKGROUNDS.default;
  }

  // If passed a category string directly
  const str = String(eventOrCategory).toLowerCase();
  for (const [key, bgUrl] of Object.entries(CATEGORY_CINEMATIC_BACKGROUNDS)) {
    if (str.includes(key)) {
      return bgUrl;
    }
  }

  return CATEGORY_CINEMATIC_BACKGROUNDS.default;
}
