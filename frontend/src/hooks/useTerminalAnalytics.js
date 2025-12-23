/**
 * Terminal Analytics Hook
 * 
 * Provides functions to track user interactions across the TSV Terminal.
 * Automatically starts a session and tracks page views.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('tsv_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('tsv_session_id', sessionId);
  }
  return sessionId;
};

// Start a new session
const startSession = async () => {
  try {
    const response = await fetch(`${API_URL}/api/analytics/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight
      })
    });
    const data = await response.json();
    if (data.session_id) {
      sessionStorage.setItem('tsv_session_id', data.session_id);
    }
  } catch (error) {
    console.warn('Failed to start analytics session:', error);
  }
};

// Track an event
const trackEvent = async (eventType, page, element = null, details = null) => {
  try {
    await fetch(`${API_URL}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        page: page,
        element: element,
        details: details,
        session_id: getSessionId(),
        user_agent: navigator.userAgent
      })
    });
  } catch (error) {
    console.warn('Failed to track event:', error);
  }
};

/**
 * Hook for tracking terminal analytics
 */
export const useTerminalAnalytics = () => {
  const location = useLocation();
  const lastPath = useRef('');
  const sessionStarted = useRef(false);

  // Start session on mount
  useEffect(() => {
    if (!sessionStarted.current) {
      startSession();
      sessionStarted.current = true;
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      trackEvent('page_view', location.pathname);
      lastPath.current = location.pathname;
    }
  }, [location.pathname]);

  // Track clicks
  const trackClick = useCallback((element, details = null) => {
    trackEvent('click', location.pathname, element, details);
  }, [location.pathname]);

  // Track feature usage
  const trackFeatureUse = useCallback((feature, details = null) => {
    trackEvent('feature_use', feature, null, details);
  }, []);

  // Track custom events
  const trackCustomEvent = useCallback((eventType, details = null) => {
    trackEvent(eventType, location.pathname, null, details);
  }, [location.pathname]);

  return {
    trackClick,
    trackFeatureUse,
    trackCustomEvent
  };
};

/**
 * Non-hook version for use outside of React components
 */
export const terminalAnalytics = {
  trackPageView: (page) => trackEvent('page_view', page),
  trackClick: (page, element, details = null) => trackEvent('click', page, element, details),
  trackFeatureUse: (feature, details = null) => trackEvent('feature_use', feature, null, details),
  trackEvent: trackEvent
};

export default useTerminalAnalytics;
