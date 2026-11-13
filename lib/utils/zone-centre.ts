/**
 * A rough idea of where the reader is, from the time zone their device is set to, for when they have not shared their location.
 *
 * The sky behind the app follows the sun, and how high the sun is depends on the latitude as much as the hour: at 45 degrees north in
 * November the sun has set by five, in Kuala Lumpur it has not set until after seven. With no location to go on the sky used to assume
 * 45 degrees north, so someone near the equator saw night two hours early (the installed Home Screen app never has a saved location,
 * because it keeps its own storage). The time zone is already known to the page, says nothing precise, and is not sent anywhere:
 * a city in the zone is near enough for a colour of sky.
 */

const CENTRES: Record<string, [number, number]> = {
  // Asia
  'Asia/Kuala_Lumpur': [3.14, 101.69], 'Asia/Singapore': [1.35, 103.82], 'Asia/Jakarta': [-6.2, 106.85], 'Asia/Bangkok': [13.75, 100.5],
  'Asia/Ho_Chi_Minh': [10.8, 106.7], 'Asia/Manila': [14.6, 121.0], 'Asia/Hong_Kong': [22.3, 114.17], 'Asia/Shanghai': [31.2, 121.5],
  'Asia/Taipei': [25.03, 121.56], 'Asia/Tokyo': [35.68, 139.7], 'Asia/Seoul': [37.57, 126.98], 'Asia/Kolkata': [19.07, 72.88],
  'Asia/Calcutta': [19.07, 72.88], 'Asia/Dubai': [25.2, 55.27], 'Asia/Karachi': [24.86, 67.0], 'Asia/Dhaka': [23.8, 90.4],
  'Asia/Kathmandu': [27.7, 85.3], 'Asia/Colombo': [6.93, 79.85], 'Asia/Riyadh': [24.7, 46.7], 'Asia/Tehran': [35.7, 51.4],
  'Asia/Jerusalem': [31.77, 35.21], 'Asia/Yangon': [16.8, 96.15], 'Asia/Phnom_Penh': [11.56, 104.9], 'Asia/Brunei': [4.9, 114.9],
  'Asia/Kabul': [34.5, 69.2], 'Asia/Tashkent': [41.3, 69.24], 'Asia/Almaty': [43.25, 76.9], 'Asia/Baghdad': [33.3, 44.4],
  'Asia/Beirut': [33.9, 35.5], 'Asia/Kuching': [1.55, 110.35], 'Asia/Makassar': [-5.15, 119.4], 'Asia/Ulaanbaatar': [47.9, 106.9],
  // Europe
  'Europe/London': [51.5, -0.12], 'Europe/Dublin': [53.35, -6.26], 'Europe/Lisbon': [38.7, -9.14], 'Europe/Madrid': [40.4, -3.7],
  'Europe/Paris': [48.85, 2.35], 'Europe/Berlin': [52.5, 13.4], 'Europe/Rome': [41.9, 12.5], 'Europe/Amsterdam': [52.37, 4.9],
  'Europe/Brussels': [50.85, 4.35], 'Europe/Zurich': [47.37, 8.54], 'Europe/Vienna': [48.2, 16.37], 'Europe/Prague': [50.08, 14.43],
  'Europe/Warsaw': [52.23, 21.0], 'Europe/Stockholm': [59.33, 18.07], 'Europe/Oslo': [59.9, 10.75], 'Europe/Copenhagen': [55.68, 12.57],
  'Europe/Helsinki': [60.17, 24.94], 'Europe/Athens': [37.98, 23.73], 'Europe/Kiev': [50.45, 30.5], 'Europe/Kyiv': [50.45, 30.5],
  'Europe/Moscow': [55.75, 37.6], 'Europe/Istanbul': [41.0, 28.98], 'Europe/Budapest': [47.5, 19.04], 'Europe/Bucharest': [44.43, 26.1],
  // Africa
  'Africa/Cairo': [30.04, 31.24], 'Africa/Lagos': [6.52, 3.38], 'Africa/Nairobi': [-1.29, 36.82], 'Africa/Johannesburg': [-26.2, 28.05],
  'Africa/Casablanca': [33.57, -7.59], 'Africa/Accra': [5.6, -0.19], 'Africa/Addis_Ababa': [9.03, 38.74], 'Africa/Algiers': [36.75, 3.04],
  // Americas
  'America/New_York': [40.7, -74.0], 'America/Chicago': [41.9, -87.6], 'America/Denver': [39.74, -104.99], 'America/Los_Angeles': [34.05, -118.24],
  'America/Phoenix': [33.45, -112.07], 'America/Anchorage': [61.2, -149.9], 'Pacific/Honolulu': [21.3, -157.86], 'America/Toronto': [43.65, -79.38],
  'America/Vancouver': [49.28, -123.12], 'America/Mexico_City': [19.43, -99.13], 'America/Bogota': [4.71, -74.07], 'America/Lima': [-12.05, -77.04],
  'America/Sao_Paulo': [-23.55, -46.63], 'America/Argentina/Buenos_Aires': [-34.6, -58.38], 'America/Santiago': [-33.45, -70.67],
  'America/Caracas': [10.5, -66.9], 'America/Havana': [23.13, -82.38], 'America/Halifax': [44.65, -63.58], 'America/Panama': [8.98, -79.52],
  // Oceania
  'Australia/Sydney': [-33.87, 151.2], 'Australia/Melbourne': [-37.8, 144.96], 'Australia/Brisbane': [-27.47, 153.03],
  'Australia/Perth': [-31.95, 115.86], 'Australia/Adelaide': [-34.93, 138.6], 'Australia/Darwin': [-12.46, 130.84], 'Pacific/Auckland': [-36.85, 174.76],
  'Pacific/Fiji': [-18.14, 178.44],
};

/** Where the device's time zone says the reader probably is, or null when the zone is not one this knows. */
export function zoneCentre(): { latitude: number; longitude: number } | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const c = CENTRES[zone];
    return c ? { latitude: c[0], longitude: c[1] } : null;
  } catch {
    return null;
  }
}
