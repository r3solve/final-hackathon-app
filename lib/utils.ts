export const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters except +
    let cleaned = text.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +233
    if (!cleaned.startsWith('+233')) {
      if (cleaned.startsWith('233')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '+233' + cleaned.substring(1);
      } else if (cleaned.startsWith('+')) {
        // Keep as is
      } else {
        cleaned = '+233' + cleaned;
      }
    }
    
    // Limit to +233 + 9 digits
    if (cleaned.length > 13) {
      cleaned = cleaned.substring(0, 13);
    }
    
    return cleaned;
  };