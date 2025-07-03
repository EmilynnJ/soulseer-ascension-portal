import { useAuth } from '@clerk/clerk-react';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await window.Clerk?.session?.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async syncProfile(profileData: any) {
    return this.request('/auth/sync-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(updates: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Session endpoints
  async getSession(sessionId: string) {
    return this.request(`/sessions/${sessionId}`);
  }

  async createSession(sessionData: any) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateSession(sessionId: string, updates: any) {
    return this.request(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getSessionMessages(sessionId: string) {
    return this.request(`/sessions/${sessionId}/messages`);
  }

  async sendMessage(sessionId: string, message: any) {
    return this.request(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async updateBilling(billingData: any) {
    return this.request('/sessions/billing', {
      method: 'POST',
      body: JSON.stringify(billingData),
    });
  }

  // Reader endpoints
  async getReaders(filters?: any) {
    const params = filters ? `?${new URLSearchParams(filters)}` : '';
    return this.request(`/readers${params}`);
  }

  async getReader(readerId: string) {
    return this.request(`/readers/${readerId}`);
  }

  async updateReaderStatus(status: string) {
    return this.request('/readers/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Payment endpoints
  async createCheckoutSession(amount: number) {
    return this.request('/payments/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getPaymentHistory() {
    return this.request('/payments/history');
  }

  // Dashboard endpoints
  async getDashboardData(role: string) {
    return this.request(`/dashboard/${role}`);
  }

  async getStats(role: string) {
    return this.request(`/dashboard/${role}/stats`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;