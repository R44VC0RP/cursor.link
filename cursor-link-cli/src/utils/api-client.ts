import { AuthManager } from './auth-client.js';

export interface RemoteRule {
  id: string;
  title: string;
  content: string;
  ruleType: string;
  isPublic: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRuleRequest {
  title: string;
  content: string;
  ruleType: string;
  isPublic: boolean;
}

export class ApiClient {
  constructor(private authManager: AuthManager) {}

  async getUserRules(): Promise<RemoteRule[]> {
    const response = await this.authManager.makeAuthenticatedRequest('/api/my-rules');
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch user rules: ${error}`);
    }
    
    return response.json() as Promise<RemoteRule[]>;
  }

  async getAllAccessibleRules(): Promise<RemoteRule[]> {
    const response = await this.authManager.makeAuthenticatedRequest('/api/cursor-rules');
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch rules: ${error}`);
    }
    
    return response.json() as Promise<RemoteRule[]>;
  }

  async createRule(rule: CreateRuleRequest): Promise<RemoteRule> {
    const response = await this.authManager.makeAuthenticatedRequest('/api/cursor-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create rule: ${error}`);
    }
    
    return response.json() as Promise<RemoteRule>;
  }

  async updateRule(id: string, rule: CreateRuleRequest): Promise<RemoteRule> {
    const response = await this.authManager.makeAuthenticatedRequest('/api/cursor-rules', {
      method: 'PUT',
      body: JSON.stringify({ id, ...rule }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update rule: ${error}`);
    }
    
    return response.json() as Promise<RemoteRule>;
  }

  async deleteRule(id: string): Promise<void> {
    const response = await this.authManager.makeAuthenticatedRequest('/api/cursor-rules', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete rule: ${error}`);
    }
  }

  async getRuleById(id: string): Promise<RemoteRule | null> {
    const response = await this.authManager.makeAuthenticatedRequest(`/api/cursor-rules?ruleId=${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.text();
      throw new Error(`Failed to fetch rule: ${error}`);
    }
    
    const rules = await response.json() as RemoteRule[];
    return rules.length > 0 ? rules[0] : null;
  }
}
