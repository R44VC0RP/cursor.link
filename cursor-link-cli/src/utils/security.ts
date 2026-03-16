import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.cursor-link');
const TOKEN_FILE = path.join(CONFIG_DIR, 'token.json');

/**
 * Security utilities for token management
 * Following OAuth 2.0 security best practices
 */
export class SecurityManager {
  /**
   * Validate token structure and required fields
   */
  static validateToken(token: any): boolean {
    if (!token || typeof token !== 'object') return false;
    
    // Required fields for a valid token
    const requiredFields = ['access_token', 'expires_at'];
    return requiredFields.every(field => 
      token.hasOwnProperty(field) && token[field] != null
    );
  }

  /**
   * Check if token is expired with a 60-second buffer
   */
  static isTokenExpired(token: any): boolean {
    if (!token.expires_at) return true;
    
    // Add 60 second buffer to avoid edge cases
    const bufferTime = 60 * 1000;
    return Date.now() > (token.expires_at - bufferTime);
  }

  /**
   * Securely clear token file
   */
  static clearTokenFile(): void {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        // Overwrite with zeros before deletion (basic security)
        const stats = fs.statSync(TOKEN_FILE);
        const zeros = Buffer.alloc(stats.size, 0);
        fs.writeFileSync(TOKEN_FILE, zeros);
        fs.unlinkSync(TOKEN_FILE);
      }
    } catch (error) {
      console.warn('Warning: Could not securely clear token file:', error);
    }
  }

  /**
   * Validate client_id format
   */
  static validateClientId(clientId: string): boolean {
    // Basic validation: should be alphanumeric with hyphens, reasonable length
    const clientIdPattern = /^[a-zA-Z0-9-]{3,50}$/;
    return clientIdPattern.test(clientId);
  }

  /**
   * Validate that we're using secure endpoints
   */
  static validateBaseUrl(baseUrl: string): boolean {
    try {
      const url = new URL(baseUrl);
      
      // In production, require HTTPS
      if (process.env.NODE_ENV === 'production') {
        return url.protocol === 'https:';
      }
      
      // In development, allow localhost with HTTP
      if (url.protocol === 'http:' && 
          (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        return true;
      }
      
      // Otherwise require HTTPS
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Sanitize error messages to avoid leaking sensitive information
   */
  static sanitizeError(error: any): string {
    if (typeof error === 'string') return error;
    
    // Common error fields that are safe to display
    const safeFields = ['error', 'error_description', 'message'];
    
    for (const field of safeFields) {
      if (error[field] && typeof error[field] === 'string') {
        return error[field];
      }
    }
    
    return 'An unexpected error occurred';
  }
}
