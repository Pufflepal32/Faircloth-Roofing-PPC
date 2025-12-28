/**
 * UTM Parameter and Campaign Attribution Tracking
 * Include this script on all PPC landing pages before the form script
 *
 * Usage:
 * 1. Add <script src="/js/utm-tracking.js"></script> before your form script
 * 2. Call window.getAttributionData() when submitting form
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'ppc_attribution';

    /**
     * Parse UTM parameters from current URL
     */
    function parseUTMParams() {
        var params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            utm_term: params.get('utm_term') || '',
            utm_content: params.get('utm_content') || '',
            gclid: params.get('gclid') || '',      // Google Click ID
            fbclid: params.get('fbclid') || '',    // Facebook Click ID
            msclkid: params.get('msclkid') || ''   // Microsoft Click ID
        };
    }

    /**
     * Capture full attribution data
     */
    function captureAttribution() {
        var utmParams = parseUTMParams();

        return {
            // UTM Parameters
            utm_source: utmParams.utm_source,
            utm_medium: utmParams.utm_medium,
            utm_campaign: utmParams.utm_campaign,
            utm_term: utmParams.utm_term,
            utm_content: utmParams.utm_content,
            gclid: utmParams.gclid,
            fbclid: utmParams.fbclid,
            msclkid: utmParams.msclkid,

            // Page context
            landing_page: window.location.pathname,
            landing_page_full: window.location.href.split('?')[0],
            referrer: document.referrer || 'direct',

            // Timestamp
            first_visit: new Date().toISOString()
        };
    }

    /**
     * Check if any UTM params are present
     */
    function hasUTMParams(attribution) {
        return attribution.utm_source ||
               attribution.utm_medium ||
               attribution.utm_campaign ||
               attribution.gclid ||
               attribution.fbclid ||
               attribution.msclkid;
    }

    /**
     * Store attribution in sessionStorage
     * Uses last-touch model (updates if new UTM params present)
     */
    function storeAttribution() {
        var attribution = captureAttribution();

        try {
            var existing = sessionStorage.getItem(STORAGE_KEY);

            if (!existing) {
                // First visit - store everything
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
            } else if (hasUTMParams(attribution)) {
                // New visit with UTM params - update (last-touch)
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
            }
            // If no UTM params and we have existing data, keep the existing data
        } catch (e) {
            // sessionStorage not available (private browsing, etc.)
            console.warn('UTM Tracking: sessionStorage not available');
        }
    }

    /**
     * Get attribution data for form submission
     * Provides fallbacks for direct traffic
     */
    function getAttributionData() {
        var stored = null;

        try {
            stored = sessionStorage.getItem(STORAGE_KEY);
        } catch (e) {
            // sessionStorage not available
        }

        if (stored) {
            try {
                var data = JSON.parse(stored);
                return {
                    utm_source: data.utm_source || 'direct',
                    utm_medium: data.utm_medium || 'none',
                    utm_campaign: data.utm_campaign || 'none',
                    utm_term: data.utm_term || '',
                    utm_content: data.utm_content || '',
                    gclid: data.gclid || '',
                    fbclid: data.fbclid || '',
                    msclkid: data.msclkid || '',
                    landing_page: data.landing_page || window.location.pathname,
                    referrer: data.referrer || 'direct',
                    first_visit: data.first_visit || ''
                };
            } catch (e) {
                // JSON parse error
            }
        }

        // Fallback if no stored data or error
        return {
            utm_source: 'direct',
            utm_medium: 'none',
            utm_campaign: 'none',
            utm_term: '',
            utm_content: '',
            gclid: '',
            fbclid: '',
            msclkid: '',
            landing_page: window.location.pathname,
            referrer: document.referrer || 'direct',
            first_visit: new Date().toISOString()
        };
    }

    /**
     * Format attribution as readable string for CRM notes
     */
    function formatAttributionNote() {
        var data = getAttributionData();
        var lines = [];

        lines.push('=== CAMPAIGN ATTRIBUTION ===');
        lines.push('Source: ' + data.utm_source);
        lines.push('Medium: ' + data.utm_medium);
        lines.push('Campaign: ' + data.utm_campaign);

        if (data.utm_term) lines.push('Keyword: ' + data.utm_term);
        if (data.utm_content) lines.push('Ad Variation: ' + data.utm_content);
        if (data.gclid) lines.push('Google Click ID: ' + data.gclid);
        if (data.fbclid) lines.push('Facebook Click ID: ' + data.fbclid);
        if (data.msclkid) lines.push('Microsoft Click ID: ' + data.msclkid);

        lines.push('Landing Page: ' + data.landing_page);
        lines.push('Referrer: ' + data.referrer);

        return lines.join('\n');
    }

    // Capture attribution on page load
    storeAttribution();

    // Expose API globally
    window.UTMTracking = {
        getAttributionData: getAttributionData,
        formatAttributionNote: formatAttributionNote,
        storeAttribution: storeAttribution
    };

    // Simple function for backwards compatibility
    window.getAttributionData = getAttributionData;

})();
