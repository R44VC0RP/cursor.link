// Type definitions for device authorization client methods
export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  interval?: number;
  expires_in?: number;
}

export interface DeviceTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface DeviceError {
  error: string;
  error_description?: string;
}

export interface DeviceAuthClient {
  device: {
    code: (params: { client_id: string; scope?: string }) => Promise<{
      data?: DeviceCodeResponse;
      error?: DeviceError;
    }>;
    token: (params: { 
      grant_type: string; 
      device_code: string; 
      client_id: string;
      fetchOptions?: any;
    }) => Promise<{
      data?: DeviceTokenResponse;
      error?: DeviceError;
    }>;
  };
  getSession: (options?: any) => Promise<{
    data?: {
      user?: {
        id: string;
        name?: string;
        email?: string;
      };
    };
    error?: any;
  }>;
}
