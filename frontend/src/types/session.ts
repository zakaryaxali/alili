/**
 * TypeScript interfaces for yoga session management
 */

export interface SessionPose {
  pose_name: string;
  duration: number; // in seconds
  order: number;
  is_pain_target: boolean;
  is_improvement_target: boolean;
}

export interface YogaSession {
  id: string;
  poses: SessionPose[];
  total_duration: number; // in minutes
  num_poses: number;
  pain_areas: string[];
  improvement_areas: string[];
}

export interface SessionGenerateRequest {
  pain_areas: string[];
  improvement_areas: string[];
  duration_minutes: number;
}

export interface SessionPreview {
  estimated_poses: number;
  targets_pain: boolean;
  targets_improvement: boolean;
}

export interface SessionCompleteRequest {
  completed_poses: number;
  total_time: number; // in seconds
}

export type BodyPartCategory = 'pain' | 'improvement';

export interface BodyPartSelection {
  name: string;
  category: BodyPartCategory;
}

export type SessionScreen =
  | 'welcome'
  | 'camera-setup'
  | 'tutorial'
  | 'selector'
  | 'config'
  | 'active'
  | 'complete';
