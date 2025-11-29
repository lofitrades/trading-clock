// src/utils/newsApi.js
/**
 * News API Service for JBlanked News API
 * Documentation: https://www.jblanked.com/news/api/docs/
 * 
 * This service handles all API calls to the JBlanked News API
 * including the Calendar endpoint for economic events.
 */

// Use proxy in development to bypass CORS, direct URL in production
const NEWS_API_BASE_URL = import.meta.env.DEV 
  ? '/api/news' 
  : 'https://www.jblanked.com/news/api';

/**
 * Get the API key from environment variables
 */
const getApiKey = () => {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  if (!apiKey) {
    console.warn('NEWS API: API key not found in environment variables');
  }
  return apiKey;
};

/**
 * Get headers for API requests
 */
const getHeaders = () => {
  const apiKey = getApiKey();
  return {
    'Content-Type': 'application/json',
    ...(apiKey && { 'Authorization': `Api-Key ${apiKey}` })
  };
};

/**
 * Generic fetch wrapper with error handling
 */
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers: getHeaders(),
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('News API Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch data from News API';
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to News API. Please check your internet connection or API key.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Invalid API key. Please check your VITE_NEWS_API_KEY in .env file.';
    } else if (error.message.includes('403')) {
      errorMessage = 'Access forbidden. Your API key may not have permission for this endpoint.';
    } else if (error.message.includes('404')) {
      errorMessage = 'API endpoint not found. Please check the API documentation.';
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
};

/**
 * Fetch calendar events for a specific time range
 * Based on JBlanked API structure: /news/api/{source}/calendar/{frequency}/
 * 
 * @param {Object} options - Optional parameters
 * @param {string} options.frequency - 'today'|'week'|'month'|'year'|'all' (default: 'today')
 * @param {string} options.news_source - 'mql5'|'forex-factory' (default: 'mql5')
 * @returns {Promise<Object>} Response object with success status and data/error
 */
export const getCalendarEvents = async (options = {}) => {
  const { frequency = 'today', news_source = 'mql5' } = options;
  
  // Correct endpoint format from JBlanked API
  const url = `${NEWS_API_BASE_URL}/${news_source}/calendar/${frequency}/`;
  
  console.log('Fetching calendar events from:', url);
  
  return fetchWithErrorHandling(url);
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Get calendar events for today
 * Free tier uses /full-list/ endpoint and filters client-side for today's events
 * 
 * NOTE: Free tier has ONE request per day limit
 * Set VITE_USE_MOCK_NEWS=true in .env to use mock data during development
 */
export const getTodayEvents = async (options = {}) => {
  const { news_source = 'mql5' } = options;
  const useMock = import.meta.env.VITE_USE_MOCK_NEWS === 'true';
  
  // Use mock data to avoid hitting the 1 request/day rate limit
  if (useMock) {
    console.log('📊 NEWS API: Using mock data (VITE_USE_MOCK_NEWS=true)');
    console.log('💡 Set VITE_USE_MOCK_NEWS=false in .env to use real API');
    return getMockTodayEvents();
  }
  
  // Free tier endpoint - returns ALL events with their complete history
  const url = `${NEWS_API_BASE_URL}/${news_source}/full-list/`;
  
  console.log('Fetching full event list from:', url);
  
  const response = await fetchWithErrorHandling(url);
  
  if (!response.success) {
    return response;
  }
  
  // Filter for today's events from the history
  const todayEvents = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  console.log('NEWS API: Filtering events for today:', today.toISOString().split('T')[0]);
  
  try {
    // Response is an object with currency keys (USD, EUR, GBP, etc.)
    const currencies = response.data;
    
    for (const currency in currencies) {
      const events = currencies[currency];
      
      if (!Array.isArray(events)) {
        continue;
      }
      
      for (const event of events) {
        // Check if event has history
        if (!event.History || !Array.isArray(event.History)) {
          continue;
        }
        
        // Find today's occurrences in history
        for (const historyItem of event.History) {
          // API date format: "YYYY.MM.DD HH:MM:SS"
          const eventDate = new Date(historyItem.Date.replace(/\./g, '-').replace(' ', 'T'));
          
          if (eventDate >= today && eventDate < tomorrow) {
            todayEvents.push({
              Name: event.Name,
              Currency: currency,
              Event_ID: event.Event_ID,
              Date: historyItem.Date,
              Actual: historyItem.Actual,
              Forecast: historyItem.Forecast,
              Previous: historyItem.Previous,
              Strength: historyItem.Strength || 'medium'
            });
          }
        }
      }
    }
    
    console.log(`NEWS API: Found ${todayEvents.length} events for today`);
    
    return {
      success: true,
      data: todayEvents
    };
  } catch (error) {
    console.error('Error filtering today\'s events:', error);
    return {
      success: false,
      error: 'Failed to parse events data'
    };
  }
};

// Mock data removed - using real API now

/**
 * Generate mock data for development (matches real API structure)
 * Free tier is limited to 1 request per day, so use this for testing
 */
const getMockTodayEvents = () => {
  const today = new Date();
  const formatDate = (hours, minutes) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hour}:${min}:00`;
  };
  
  const mockEvents = [
    {
      Name: 'US Non-Farm Payrolls',
      Currency: 'USD',
      Event_ID: 19,
      Date: formatDate(8, 30),
      Actual: 187,
      Forecast: 200,
      Previous: 336,
      Strength: 'high'
    },
    {
      Name: 'Unemployment Rate',
      Currency: 'USD',
      Event_ID: 20,
      Date: formatDate(8, 30),
      Actual: 3.9,
      Forecast: 3.8,
      Previous: 3.8,
      Strength: 'high'
    },
    {
      Name: 'Average Hourly Earnings m/m',
      Currency: 'USD',
      Event_ID: 1,
      Date: formatDate(8, 30),
      Actual: 0.4,
      Forecast: 0.3,
      Previous: 0.2,
      Strength: 'medium'
    },
    {
      Name: 'GDP Growth Rate',
      Currency: 'EUR',
      Event_ID: 156,
      Date: formatDate(10, 0),
      Actual: null,
      Forecast: 2.1,
      Previous: 2.0,
      Strength: 'high'
    },
    {
      Name: 'CPI y/y',
      Currency: 'GBP',
      Event_ID: 186,
      Date: formatDate(12, 0),
      Actual: null,
      Forecast: 3.2,
      Previous: 3.1,
      Strength: 'high'
    },
    {
      Name: 'Retail Sales m/m',
      Currency: 'CAD',
      Event_ID: 326,
      Date: formatDate(13, 30),
      Actual: null,
      Forecast: 0.5,
      Previous: 0.3,
      Strength: 'medium'
    },
    {
      Name: 'RBA Interest Rate Decision',
      Currency: 'AUD',
      Event_ID: 426,
      Date: formatDate(14, 30),
      Actual: null,
      Forecast: 4.35,
      Previous: 4.35,
      Strength: 'high'
    },
    {
      Name: 'Trade Balance',
      Currency: 'JPY',
      Event_ID: 526,
      Date: formatDate(23, 50),
      Actual: null,
      Forecast: -0.5,
      Previous: -0.7,
      Strength: 'low'
    }
  ];
  
  return {
    success: true,
    data: mockEvents
  };
};

/**
 * Parse and format event data for display
      forecast: '170K',
      previous: '157K',
      outcome: 'better',
      strength: 'high',
      quality: 'good',
      projection: 'bullish'
    },
    {
      id: 'mock-2',
      name: 'EUR Consumer Price Index (YoY)',
      currency: 'EUR',
      category: 'Inflation',
      date: new Date(baseTime.getTime() + 3600000).toISOString(), // +1 hour
      actual: '2.9%',
      forecast: '3.0%',
      previous: '3.1%',
      outcome: 'better',
      strength: 'high',
      quality: 'good',
      projection: 'dovish'
    },
    {
      id: 'mock-3',
      name: 'GBP Interest Rate Decision',
      currency: 'GBP',
      category: 'Central Bank',
      date: new Date(baseTime.getTime() + 7200000).toISOString(), // +2 hours
      actual: '5.25%',
      forecast: '5.25%',
      previous: '5.00%',
      outcome: 'as_expected',
      strength: 'high',
      quality: 'good',
      projection: 'hawkish'
    },
    {
      id: 'mock-4',
      name: 'JPY Manufacturing PMI',
      currency: 'JPY',
      category: 'Economic Activity',
      date: new Date(baseTime.getTime() + 10800000).toISOString(), // +3 hours
      actual: '49.2',
      forecast: '49.5',
      previous: '49.6',
      outcome: 'worse',
      strength: 'medium',
      quality: 'moderate',
      projection: 'bearish'
    },
    {
      id: 'mock-5',
      name: 'CAD Retail Sales (MoM)',
      currency: 'CAD',
      category: 'Consumer Spending',
      date: new Date(baseTime.getTime() + 14400000).toISOString(), // +4 hours
      actual: '0.3%',
      forecast: '0.2%',
      previous: '0.1%',
      outcome: 'better',
      strength: 'medium',
      quality: 'good',
      projection: 'bullish'
    },
    {
      id: 'mock-6',
      name: 'AUD Employment Change',
      currency: 'AUD',
      category: 'Employment',
      date: new Date(baseTime.getTime() + 18000000).toISOString(), // +5 hours
      actual: '15.9K',
      forecast: '15.0K',
      previous: '14.5K',
      outcome: 'better',
      strength: 'low',
      quality: 'good',
      projection: 'bullish'
    },
    {
      id: 'mock-7',
      name: 'CHF Trade Balance',
      currency: 'CHF',
      category: 'Trade',
      date: new Date(baseTime.getTime() - 3600000).toISOString(), // -1 hour (past event)
      actual: '3.2B',
      forecast: '3.0B',
      previous: '2.9B',
      outcome: 'better',
      strength: 'low',
      quality: 'good',
      projection: 'bullish'
    },
    {
      id: 'mock-8',
      name: 'NZD GDP (QoQ)',
      currency: 'NZD',
      category: 'Economic Activity',
      date: new Date(baseTime.getTime() - 7200000).toISOString(), // -2 hours (past event)
      actual: '0.5%',
      forecast: '0.4%',
      previous: '0.3%',
      outcome: 'better',
      strength: 'medium',
      quality: 'good',
      projection: 'bullish'
    }
  ];
};

/**
 * Parse and format event data for display
 * Maps JBlanked API response to our component structure
 * API returns: {Name, Currency, Event_ID, Category, Date, Actual, Forecast, Previous, Outcome, Strength, Quality, Projection}
 * @param {Object} event - Raw event data from API
 * @returns {Object} Formatted event data
 */
export const formatEventData = (event) => {
  // Parse date - API returns format like "2025.11.29 14:30:00"
  let dateTime = null;
  let time = '';
  
  if (event.Date) {
    try {
      // Convert API date format to standard format
      const dateStr = event.Date.replace(/\./g, '-');
      dateTime = new Date(dateStr);
      time = dateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.warn('Date parsing error:', e);
    }
  }
  
  return {
    id: event.Event_ID || event.event_id || '',
    name: event.Name || event.name || 'Unknown Event',
    currency: event.Currency || event.currency || '',
    time,
    dateTime,
    impact: event.Strength || event.strength || 'low', // Strength maps to impact
    actual: event.Actual !== undefined ? event.Actual : '-',
    forecast: event.Forecast !== undefined ? event.Forecast : '-',
    previous: event.Previous !== undefined ? event.Previous : '-',
    category: event.Category || event.category || '',
    outcome: event.Outcome || event.outcome || '',
    quality: event.Quality || event.quality || '',
    projection: event.Projection || event.projection || '',
  };
};

/**
 * Sort events by time (ascending)
 */
export const sortEventsByTime = (events) => {
  return events.sort((a, b) => {
    if (!a.dateTime || !b.dateTime) return 0;
    return a.dateTime - b.dateTime;
  });
};

/**
 * Filter events by impact level
 */
export const filterEventsByImpact = (events, impacts = []) => {
  if (!impacts || impacts.length === 0) return events;
  return events.filter(event => 
    impacts.includes(event.impact?.toLowerCase())
  );
};

/**
 * Get impact color based on level
 * Returns color consistent with app's design system
 */
export const getImpactColor = (impact) => {
  const impactLower = impact?.toLowerCase() || 'low';
  
  switch (impactLower) {
    case 'high':
      return '#d32f2f'; // Red
    case 'medium':
    case 'moderate':
      return '#f57c00'; // Orange
    case 'low':
      return '#018786'; // Primary teal (from theme)
    default:
      return '#666666'; // Secondary text color
  }
};

/**
 * Get impact badge text
 */
export const getImpactBadge = (impact) => {
  const impactLower = impact?.toLowerCase() || 'low';
  
  switch (impactLower) {
    case 'high':
      return 'H';
    case 'medium':
    case 'moderate':
      return 'M';
    case 'low':
      return 'L';
    default:
      return '-';
  }
};
