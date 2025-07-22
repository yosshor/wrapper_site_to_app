/**
 * @fileoverview Lead capture functionality for mobile apps
 * @author YosShor
 * @version 1.0.0
 * 
 * Handles lead capture forms, data validation, and API submission.
 * Integrates with Google Sheets and MongoDB through the backend API.
 */

/**
 * Lead Capture Manager
 * Manages lead capture forms and data submission
 */
class LeadCaptureManager {
  constructor(config) {
    this.config = config;
    this.leadCaptured = localStorage.getItem('leadCaptured') === 'true';
    this.apiEndpoint = config.apiEndpoint;
    this.fields = config.fields || [];
    this.retryCount = 0;
    this.maxRetries = 3;
    
    console.log('LeadCaptureManager initialized:', config);
  }

  /**
   * Check if lead capture should be shown
   * @returns {boolean} True if should show lead capture
   */
  shouldShowLeadCapture() {
    if (!this.config.enabled) return false;
    if (this.leadCaptured) return false;
    if (this.fields.length === 0) return false;
    
    return true;
  }

  /**
   * Show lead capture modal after delay
   * @param {number} delay - Delay in milliseconds (default: 3000)
   */
  showLeadCaptureWithDelay(delay = 3000) {
    if (!this.shouldShowLeadCapture()) return;
    
    setTimeout(() => {
      this.showLeadCapture();
    }, delay);
  }

  /**
   * Show lead capture modal immediately
   */
  showLeadCapture() {
    if (!this.shouldShowLeadCapture()) return;
    
    const modal = document.getElementById('leadCaptureModal');
    if (!modal) {
      console.error('Lead capture modal not found');
      return;
    }
    
    // Generate form fields
    this.generateFormFields();
    
    // Show modal
    modal.style.display = 'flex';
    
    // Track event
    this.trackEvent('lead_capture_shown', {
      fields_count: this.fields.length,
      trigger: 'auto'
    });
    
    console.log('Lead capture modal shown');
  }

  /**
   * Generate form fields dynamically
   */
  generateFormFields() {
    const fieldsContainer = document.getElementById('leadCaptureFields');
    if (!fieldsContainer) return;
    
    fieldsContainer.innerHTML = '';
    
    this.fields.forEach(field => {
      const fieldElement = this.createFormField(field);
      fieldsContainer.appendChild(fieldElement);
    });
  }

  /**
   * Create a form field element
   * @param {object} field - Field configuration
   * @returns {HTMLElement} Form field element
   */
  createFormField(field) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'form-field';
    
    const label = document.createElement('label');
    label.className = 'form-label';
    label.htmlFor = field.name;
    label.textContent = field.label + (field.required ? ' *' : '');
    
    const input = document.createElement('input');
    input.type = this.getInputType(field.type);
    input.id = field.name;
    input.name = field.name;
    input.className = 'form-input';
    input.placeholder = `Enter your ${field.label.toLowerCase()}`;
    
    if (field.required) {
      input.required = true;
    }
    
    // Add validation attributes
    if (field.type === 'email') {
      input.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
      input.title = 'Please enter a valid email address';
    } else if (field.type === 'phone') {
      input.pattern = '^[\\+]?[1-9][\\d\\s\\-\\(\\)]{7,15}$';
      input.title = 'Please enter a valid phone number';
    }
    
    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    
    return fieldContainer;
  }

  /**
   * Get HTML input type for field type
   * @param {string} fieldType - Field type
   * @returns {string} HTML input type
   */
  getInputType(fieldType) {
    const typeMap = {
      'text': 'text',
      'email': 'email',
      'phone': 'tel',
      'number': 'number'
    };
    
    return typeMap[fieldType] || 'text';
  }

  /**
   * Close lead capture modal
   */
  closeLeadCapture() {
    const modal = document.getElementById('leadCaptureModal');
    if (modal) {
      modal.style.display = 'none';
      
      // Track event
      this.trackEvent('lead_capture_closed', {
        method: 'manual'
      });
    }
  }

  /**
   * Submit lead capture form
   * @param {Event} event - Form submit event
   */
  async submitLeadCapture(event) {
    event.preventDefault();
    
    try {
      const form = event.target;
      const submitButton = form.querySelector('.submit-button');
      const originalText = submitButton.textContent;
      
      // Show loading state
      submitButton.textContent = 'Submitting...';
      submitButton.disabled = true;
      
      // Collect form data
      const formData = new FormData(form);
      const leadData = this.collectFormData(formData);
      
      // Validate data
      if (!this.validateFormData(leadData)) {
        throw new Error('Please fill in all required fields correctly');
      }
      
      // Add metadata
      leadData.appName = '{{APP_NAME}}';
      leadData.packageId = '{{PACKAGE_ID}}';
      leadData.timestamp = new Date().toISOString();
      leadData.source = 'app_launch';
      leadData.userAgent = navigator.userAgent;
      
      // Add device info
      await this.addDeviceInfo(leadData);
      
      // Submit to API
      await this.submitToAPI(leadData);
      
      // Mark as captured
      this.leadCaptured = true;
      localStorage.setItem('leadCaptured', 'true');
      
      // Close modal
      this.closeLeadCapture();
      
      // Show success message
      this.showSuccessMessage();
      
      // Track successful capture
      this.trackEvent('lead_captured', {
        fields_count: Object.keys(leadData).length,
        source: 'app_launch',
        success: true
      });
      
      console.log('Lead captured successfully');
      
    } catch (error) {
      console.error('Lead capture error:', error);
      
      // Show error message
      this.showErrorMessage(error.message);
      
      // Track error
      this.trackEvent('lead_capture_error', {
        error_message: error.message,
        retry_count: this.retryCount
      });
      
    } finally {
      // Reset button state
      const submitButton = document.querySelector('.submit-button');
      if (submitButton) {
        submitButton.textContent = 'Continue';
        submitButton.disabled = false;
      }
    }
  }

  /**
   * Collect form data from FormData object
   * @param {FormData} formData - Form data
   * @returns {object} Collected data
   */
  collectFormData(formData) {
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }
    
    return data;
  }

  /**
   * Validate form data
   * @param {object} data - Form data to validate
   * @returns {boolean} True if valid
   */
  validateFormData(data) {
    for (const field of this.fields) {
      if (field.required && (!data[field.name] || data[field.name].length === 0)) {
        return false;
      }
      
      // Validate email format
      if (field.type === 'email' && data[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data[field.name])) {
          return false;
        }
      }
      
      // Validate phone format
      if (field.type === 'phone' && data[field.name]) {
        const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
        if (!phoneRegex.test(data[field.name])) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Add device information to lead data
   * @param {object} leadData - Lead data object
   */
  async addDeviceInfo(leadData) {
    try {
      if (window.Capacitor && window.Capacitor.Plugins.Device) {
        const deviceInfo = await window.Capacitor.Plugins.Device.getInfo();
        leadData.deviceInfo = {
          platform: deviceInfo.platform,
          model: deviceInfo.model,
          version: deviceInfo.osVersion,
          manufacturer: deviceInfo.manufacturer
        };
      }
      
      // Add network info if available
      if (window.Capacitor && window.Capacitor.Plugins.Network) {
        const networkStatus = await window.Capacitor.Plugins.Network.getStatus();
        leadData.networkInfo = {
          connected: networkStatus.connected,
          connectionType: networkStatus.connectionType
        };
      }
    } catch (error) {
      console.error('Error collecting device info:', error);
    }
  }

  /**
   * Submit lead data to API endpoint
   * @param {object} leadData - Lead data to submit
   */
  async submitToAPI(leadData) {
    if (!this.apiEndpoint) {
      throw new Error('API endpoint not configured');
    }
    
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to submit lead data`);
    }
    
    return await response.json();
  }

  /**
   * Show success message
   */
  showSuccessMessage() {
    this.showToast('Thank you! Your information has been saved.', 'success');
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    this.showToast(`Error: ${message}`, 'error');
  }

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Message type (success/error)
   */
  showToast(message, type = 'info') {
    if (window.Capacitor && window.Capacitor.Plugins.Toast) {
      window.Capacitor.Plugins.Toast.show({
        text: message,
        duration: type === 'error' ? 'long' : 'short',
        position: 'bottom'
      });
    } else {
      // Fallback alert
      alert(message);
    }
  }

  /**
   * Track analytics event
   * @param {string} eventName - Event name
   * @param {object} parameters - Event parameters
   */
  trackEvent(eventName, parameters = {}) {
    if (window.trackEvent && typeof window.trackEvent === 'function') {
      window.trackEvent(eventName, parameters);
    }
  }
}

// Export for use in other modules
export default LeadCaptureManager;

// Make available globally for HTML usage
if (typeof window !== 'undefined') {
  window.LeadCaptureManager = LeadCaptureManager;
} 