import { User } from '../types';
import { PublicClientApplication } from '@azure/msal-browser';


import { API_SCOPES } from '../contexts/msal-auth';

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  token: string;
}

class BaseApiService {

  async request(url: string, options: RequestOptions): Promise<Response> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };


    if (options.token) {
      defaultHeaders['Authorization'] = `Bearer ${options.token}`;
    } else {
      console.warn('No token provided for API request. This may cause authentication errors.');
    }


    const mergedHeaders = {
      ...defaultHeaders,
      ...options.headers,
    };
    

    const mergedOptions = {
      ...options,
      headers: mergedHeaders
    };

    try {

      const response = await fetch(url, mergedOptions);
      

      if (!response.ok) {

        if (response.status === 401) {
          console.error('Unauthorized API request');
  
        }


        console.error(`API error ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - Check if the server is running and accessible');
        throw new Error('Unable to connect to the server. Please check if the server is running.');
      }
      throw error;
    }
  }
}


export const baseApiService = new BaseApiService();


export const apiRequest = baseApiService.request.bind(baseApiService);
