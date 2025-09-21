// Background script for Null Protocol Adtech Opt-Out Browser Extension

interface ConsentState {
  user_id: string;
  preferences: {
    do_not_sell: boolean;
    gpc_enabled: boolean;
    vendor_categories: {
      analytics: boolean;
      advertising: boolean;
      functional: boolean;
    };
  };
  signature: string;
  timestamp: string;
  version: number;
}

interface VendorRegistry {
  vendor_id: string;
  categories: string[];
  opt_out: {
    method: string;
    endpoint: string;
    requires: string[];
    evidence_expected: string[];
  };
  gpc_policy: {
    honors: boolean;
    ttl_days: number;
  };
  jurisdictions: string[];
}

class SignalOrchestrator {
  private consentState: ConsentState | null = null;
  private vendorRegistry: Map<string, VendorRegistry> = new Map();
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8787';
    this.initializeExtension();
  }

  private async initializeExtension() {
    // Load consent state from storage
    await this.loadConsentState();
    
    // Load vendor registry
    await this.loadVendorRegistry();
    
    // Set up web request listeners
    this.setupWebRequestListeners();
    
    // Set up declarative net request rules
    await this.setupDeclarativeNetRequestRules();
  }

  private async loadConsentState() {
    try {
      const result = await chrome.storage.local.get(['consentState']);
      if (result.consentState) {
        this.consentState = result.consentState;
        console.log('Loaded consent state:', this.consentState);
      }
    } catch (error) {
      console.error('Failed to load consent state:', error);
    }
  }

  private async loadVendorRegistry() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/vendor/registry`);
      if (response.ok) {
        const vendors = await response.json();
        vendors.forEach((vendor: VendorRegistry) => {
          this.vendorRegistry.set(vendor.vendor_id, vendor);
        });
        console.log('Loaded vendor registry:', this.vendorRegistry.size, 'vendors');
      }
    } catch (error) {
      console.error('Failed to load vendor registry:', error);
    }
  }

  private setupWebRequestListeners() {
    // Listen for web requests to inject GPC header
    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => {
        if (this.consentState?.preferences.gpc_enabled) {
          // Inject GPC header
          details.requestHeaders?.push({
            name: 'Sec-GPC',
            value: '1'
          });
          
          // Inject Do Not Sell header if applicable
          if (this.consentState.preferences.do_not_sell) {
            details.requestHeaders?.push({
              name: 'DNT',
              value: '1'
            });
          }
        }
        
        return { requestHeaders: details.requestHeaders };
      },
      { urls: ['<all_urls>'] },
      ['requestHeaders', 'blocking']
    );

    // Listen for responses to detect violations
    chrome.webRequest.onCompleted.addListener(
      (details) => {
        this.analyzeResponse(details);
      },
      { urls: ['<all_urls>'] }
    );
  }

  private async setupDeclarativeNetRequestRules() {
    // Set up rules to block known tracking domains when opt-outs are active
    const rules: chrome.declarativeNetRequest.Rule[] = [];
    
    if (this.consentState?.preferences.vendor_categories.advertising === false) {
      // Block advertising-related requests
      rules.push({
        id: 1,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.BLOCK
        },
        condition: {
          urlFilter: '||google-analytics.com^',
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.SCRIPT]
        }
      });
      
      rules.push({
        id: 2,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.BLOCK
        },
        condition: {
          urlFilter: '||googletagmanager.com^',
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.SCRIPT]
        }
      });
    }

    if (this.consentState?.preferences.vendor_categories.analytics === false) {
      // Block analytics-related requests
      rules.push({
        id: 3,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.BLOCK
        },
        condition: {
          urlFilter: '||facebook.com/tr^',
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.SCRIPT]
        }
      });
    }

    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
        removeRuleIds: [1, 2, 3] // Remove existing rules
      });
    } catch (error) {
      console.error('Failed to set up declarative net request rules:', error);
    }
  }

  private async analyzeResponse(details: chrome.webRequest.WebResponseCacheDetails) {
    // Analyze response for potential violations
    const url = new URL(details.url);
    const domain = url.hostname;
    
    // Check if this is a known tracking domain
    const isTrackingDomain = this.isTrackingDomain(domain);
    
    if (isTrackingDomain && this.consentState?.preferences.vendor_categories.advertising === false) {
      // Potential violation detected
      await this.reportViolation({
        type: 'tracking_request_after_optout',
        domain: domain,
        url: details.url,
        timestamp: new Date().toISOString(),
        evidence: {
          request_headers: details.responseHeaders,
          status_code: details.statusCode
        }
      });
    }
  }

  private isTrackingDomain(domain: string): boolean {
    const trackingDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com',
      'doubleclick.net',
      'googlesyndication.com',
      'amazon-adsystem.com',
      'adsystem.amazon.com'
    ];
    
    return trackingDomains.some(trackingDomain => 
      domain.includes(trackingDomain)
    );
  }

  private async reportViolation(violation: any) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/violation/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.consentState?.user_id,
          violation_type: violation.type,
          domain: violation.domain,
          url: violation.url,
          timestamp: violation.timestamp,
          evidence: violation.evidence
        })
      });

      if (response.ok) {
        console.log('Violation reported successfully');
      } else {
        console.error('Failed to report violation:', await response.text());
      }
    } catch (error) {
      console.error('Error reporting violation:', error);
    }
  }

  public async updateConsentState(newConsentState: ConsentState) {
    this.consentState = newConsentState;
    
    // Store in local storage
    await chrome.storage.local.set({ consentState: newConsentState });
    
    // Update declarative net request rules
    await this.setupDeclarativeNetRequestRules();
    
    // Send consent state to server
    try {
      const response = await fetch(`${this.apiBaseUrl}/consent/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConsentState)
      });

      if (response.ok) {
        console.log('Consent state updated on server');
      } else {
        console.error('Failed to update consent state on server:', await response.text());
      }
    } catch (error) {
      console.error('Error updating consent state on server:', error);
    }
  }

  public getConsentState(): ConsentState | null {
    return this.consentState;
  }

  public getVendorRegistry(): Map<string, VendorRegistry> {
    return this.vendorRegistry;
  }
}

// Initialize the signal orchestrator
const signalOrchestrator = new SignalOrchestrator();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_CONSENT_STATE':
      sendResponse(signalOrchestrator.getConsentState());
      break;
      
    case 'UPDATE_CONSENT_STATE':
      signalOrchestrator.updateConsentState(message.consentState);
      sendResponse({ success: true });
      break;
      
    case 'GET_VENDOR_REGISTRY':
      sendResponse(Array.from(signalOrchestrator.getVendorRegistry().values()));
      break;
      
    case 'REPORT_VIOLATION':
      signalOrchestrator.reportViolation(message.violation);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Listen for tab updates to inject content scripts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    // Inject content script to monitor page behavior
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(error => {
      console.error('Failed to inject content script:', error);
    });
  }
});

// Listen for extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Null Protocol Adtech Opt-Out extension installed');
  } else if (details.reason === 'update') {
    console.log('Null Protocol Adtech Opt-Out extension updated');
  }
});

export default signalOrchestrator;
