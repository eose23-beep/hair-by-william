const SALON_ADDRESS = "5411 N. Mesa, Suite 13C, El Paso, TX 79912";

const MAP_QUERY = encodeURIComponent(SALON_ADDRESS);
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;
export const MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;
export const MAP_EMBED_URL = `https://maps.google.com/maps?q=${MAP_QUERY}&z=16&hl=en&output=embed`;
export { SALON_ADDRESS };
