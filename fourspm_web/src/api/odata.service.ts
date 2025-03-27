import { API_CONFIG } from '../config/api';

export interface ODataResponse<T> {
  value: T[];
  '@odata.count'?: number;
}

export class ODataService {
  constructor() {}

  private getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  async get<T>(endpoint: string, token: string, query?: string): Promise<ODataResponse<T>> {
    const url = query ? `${endpoint}?${query}` : endpoint;
    const response = await fetch(url, {
      headers: this.getHeaders(token)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, token: string, data: any): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async patch<T>(endpoint: string, token: string, id: string, data: Partial<T>): Promise<void> {
    const response = await fetch(`${endpoint}(${id})`, {
      method: 'PATCH',
      headers: {
        ...this.getHeaders(token),
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async delete(endpoint: string, token: string, id: string): Promise<void> {
    const response = await fetch(`${endpoint}(${id})`, {
      method: 'DELETE',
      headers: this.getHeaders(token)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}
