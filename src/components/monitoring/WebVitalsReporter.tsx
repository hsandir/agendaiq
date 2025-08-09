'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send metrics to our API
  fetch('/api/monitoring/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch(error => {
    console.error('Failed to send metrics:', error);
  });

  // Also send to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating);
  }
}

export function WebVitalsReporter() {
  useEffect(() => {
    // Core Web Vitals
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    
    // Other metrics
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);

  return null;
}