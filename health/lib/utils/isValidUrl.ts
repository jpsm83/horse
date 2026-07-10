export const isValidUrl = (url: string): boolean => {
  // Improved regex for URL validation
  // Supports http, https, optional www
  // Ensures valid domain name format (no numbers at the end of domain)
  // Allows optional path and query parameters
  const urlRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
  return urlRegex.test(url);
}; 