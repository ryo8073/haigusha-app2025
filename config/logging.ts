export const LOGGING_CONFIG = {
  // Replace this with your Google Apps Script web app URL
  GOOGLE_APPS_SCRIPT_URL: process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || 
    'https://script.google.com/macros/s/AKfycbzf1D-wS2ZQ0vTA_JIhs3TVUFWTripoOyicqcq9qnCGS0NvZ9yw2WbYwvOSh9-_mMJH/exec',
  
  // Enable/disable logging
  ENABLED: process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true',
}; 