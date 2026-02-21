import React from 'react';
import { createRoot } from 'react-dom/client';
import SupportWidget from './SupportWidget';
import WidgetAPI from './api';

(function () {
  // Find the script tag to read data attributes
  const scripts = document.querySelectorAll('script[data-tenant-key]');
  const scriptTag = scripts[scripts.length - 1];

  if (!scriptTag) {
    console.error('[SupportHub] Missing data-tenant-key attribute on script tag');
    return;
  }

  const apiKey = scriptTag.getAttribute('data-tenant-key');
  if (!apiKey) {
    console.error('[SupportHub] data-tenant-key is empty');
    return;
  }

  // Determine API base URL from script src or current origin
  let baseUrl = '';
  try {
    const src = scriptTag.getAttribute('src');
    if (src && src.startsWith('http')) {
      const url = new URL(src);
      baseUrl = url.origin;
    }
  } catch {}

  // Fallback to same origin
  if (!baseUrl) {
    baseUrl = window.location.origin;
  }

  // Create widget container
  const container = document.createElement('div');
  container.id = 'support-hub-widget';
  document.body.appendChild(container);

  // Initialize API client
  const api = new WidgetAPI(apiKey, baseUrl);

  // Render widget
  const root = createRoot(container);
  root.render(
    React.createElement(SupportWidget, { api })
  );
})();
