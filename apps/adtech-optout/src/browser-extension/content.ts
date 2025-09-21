// Content script for Null Protocol Adtech Opt-Out Browser Extension

class ContentScript {
  private consentState: any = null;
  private violations: any[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get consent state from background script
    this.consentState = await this.sendMessage({ type: 'GET_CONSENT_STATE' });
    
    // Monitor page behavior
    this.monitorPageBehavior();
    
    // Inject GPC signal
    this.injectGPCSignal();
    
    // Monitor network requests
    this.monitorNetworkRequests();
  }

  private async sendMessage(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  private injectGPCSignal() {
    if (this.consentState?.preferences.gpc_enabled) {
      // Inject GPC signal into page
      const script = document.createElement('script');
      script.textContent = `
        // Global Privacy Control signal
        if (typeof navigator !== 'undefined') {
          Object.defineProperty(navigator, 'globalPrivacyControl', {
            value: true,
            writable: false,
            configurable: false
          });
        }
        
        // Do Not Track signal
        if (typeof navigator !== 'undefined') {
          Object.defineProperty(navigator, 'doNotTrack', {
            value: '1',
            writable: false,
            configurable: false
          });
        }
      `;
      document.documentElement.appendChild(script);
    }
  }

  private monitorPageBehavior() {
    // Monitor localStorage access
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (...args) => {
      if (this.isTrackingRelated(args[0])) {
        this.reportViolation('localStorage_access_after_optout', {
          key: args[0],
          value: args[1],
          timestamp: new Date().toISOString()
        });
      }
      return originalSetItem.apply(localStorage, args);
    };

    // Monitor cookie access
    const originalSetCookie = document.cookie;
    Object.defineProperty(document, 'cookie', {
      get: function() {
        return originalSetCookie;
      },
      set: function(value) {
        if (this.isTrackingCookie(value)) {
          this.reportViolation('cookie_set_after_optout', {
            cookie: value,
            timestamp: new Date().toISOString()
          });
        }
        return originalSetCookie = value;
      }
    });
  }

  private monitorNetworkRequests() {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0] as string;
      
      if (this.isTrackingRequest(url)) {
        this.reportViolation('tracking_request_after_optout', {
          url: url,
          timestamp: new Date().toISOString()
        });
      }
      
      return originalFetch.apply(window, args);
    };

    // Override XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (this.isTrackingRequest(url)) {
        this.reportViolation('tracking_request_after_optout', {
          url: url,
          method: method,
          timestamp: new Date().toISOString()
        });
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
  }

  private isTrackingRelated(key: string): boolean {
    const trackingKeys = ['_ga', '_gid', '_fbp', '_fbc', 'fbp', 'fbc'];
    return trackingKeys.some(trackingKey => key.includes(trackingKey));
  }

  private isTrackingCookie(cookie: string): boolean {
    const trackingCookies = ['_ga', '_gid', '_fbp', '_fbc', 'fbp', 'fbc'];
    return trackingCookies.some(trackingCookie => cookie.includes(trackingCookie));
  }

  private isTrackingRequest(url: string): boolean {
    const trackingDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com',
      'doubleclick.net',
      'googlesyndication.com',
      'amazon-adsystem.com'
    ];
    
    return trackingDomains.some(domain => url.includes(domain));
  }

  private async reportViolation(type: string, evidence: any) {
    const violation = {
      type: type,
      evidence: evidence,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    this.violations.push(violation);
    
    // Send to background script
    await this.sendMessage({
      type: 'REPORT_VIOLATION',
      violation: violation
    });
  }
}

// Initialize content script
new ContentScript();
