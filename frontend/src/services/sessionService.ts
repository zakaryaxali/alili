/**
 * API client for yoga session management
 */

import type {
  SessionGenerateRequest,
  YogaSession,
  SessionPreview,
  SessionCompleteRequest
} from '../types/session';
import { getApiUrl } from './api';

const API_BASE_URL = getApiUrl();

export class SessionService {
  /**
   * Generate a new yoga session
   */
  static async generateSession(request: SessionGenerateRequest): Promise<YogaSession> {
    const response = await fetch(`${API_BASE_URL}/session/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a preview of session before generating
   */
  static async previewSession(request: SessionGenerateRequest): Promise<SessionPreview> {
    const response = await fetch(`${API_BASE_URL}/session/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to preview session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Retrieve a session by ID
   */
  static async getSession(sessionId: string): Promise<YogaSession> {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Mark a session as completed
   */
  static async completeSession(
    sessionId: string,
    request: SessionCompleteRequest
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete session: ${response.statusText}`);
    }
  }

  /**
   * Get list of available body parts
   */
  static async getBodyParts(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/session/body-parts/list`);

    if (!response.ok) {
      throw new Error(`Failed to get body parts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.body_parts;
  }
}
