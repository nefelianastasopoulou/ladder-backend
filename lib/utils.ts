/**
 * Smart first name extraction utility
 * Handles edge cases like extra spaces, single names, and empty strings
 */
export const getFirstName = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }
  
  const trimmed = fullName.trim();
  if (!trimmed) {
    return '';
  }
  
  const firstSpace = trimmed.indexOf(' ');
  return firstSpace > 0 ? trimmed.substring(0, firstSpace) : trimmed;
};

/**
 * Capitalize first letter of a string
 */
export const capitalizeFirst = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get formatted first name (capitalized)
 */
export const getFormattedFirstName = (fullName: string): string => {
  const firstName = getFirstName(fullName);
  return capitalizeFirst(firstName);
};
