// frontend/src/lib/imageUtils.ts

const BACKEND_ORIGIN = 'http://localhost:5000';

/**
 * Converts a product image URL (from the API) into an absolute URL that the browser can load.
 * - If the URL already starts with "http", it's returned as-is.
 * - If it's a relative path (like /uploads/...), we prepend the backend origin.
 * - If empty or undefined, returns an empty string.
 */
export const getImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_ORIGIN}${url}`;
};