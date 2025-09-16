// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    status: number;
    timestamp: string;
    details?: any;
    type?: string;
  };
  status: number;
  timestamp: string;
  requestId?: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  username: string;
  is_admin: boolean;
  profile_picture?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  bio?: string;
  location?: string;
  field?: string;
  avatar_url?: string;
  age_range?: string;
  field_of_study?: string; // JSON string
  academic_level?: string;
  university?: string;
  preferences?: string; // JSON string
  onboarding_completed: boolean;
  onboarding_completed_at?: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_vibration: boolean;
  location_services: boolean;
  language: string;
  show_activity_status: boolean;
  show_last_seen: boolean;
  allow_direct_messages: boolean;
  allow_connection_requests: boolean;
  community_posts_visibility: string;
  photo_upload_restriction: string;
  allowed_photo_sources: string; // JSON string
}

// Community Types
export interface Community {
  id: number;
  name: string;
  description?: string;
  category?: string;
  created_by: number;
  member_count: number;
  post_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_username?: string;
  is_member?: boolean;
}

export interface CommunityMember {
  id: number;
  user_id: number;
  community_id: number;
  role: 'admin' | 'member';
  joined_at: string;
}

// Post Types
export interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  community_id?: number;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_username?: string;
  community_name?: string;
}

export interface Comment {
  id: number;
  content: string;
  author_id: number;
  post_id: number;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_username?: string;
}

// Opportunity Types
export interface Opportunity {
  id: number;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  field?: string;
  image_url?: string;
  deadline?: string;
  requirements?: string;
  contact_info?: string;
  application_url?: string;
  is_external_application: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: number;
  user_id: number;
  opportunity_id: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  applied_date: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  opportunity_id: number;
  created_at: string;
}

// Chat Types
export interface Conversation {
  id: number;
  type: 'individual' | 'group' | 'community';
  name?: string;
  created_by: number;
  updated_at: string;
  created_at: string;
  other_user?: {
    name: string;
    username: string;
    avatar?: string;
  };
  last_message?: string;
  last_message_time?: string;
  last_message_sender_id?: number;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_username?: string;
}

// Report Types
export interface Report {
  id: number;
  reporter_id: number;
  reported_type: 'user' | 'community' | 'post';
  reported_id: number;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  reporter_name?: string;
  reporter_username?: string;
  reviewed_by_name?: string;
  reviewed_by_username?: string;
}

// Search Types
export interface SearchResult {
  users: User[];
  posts: Post[];
  communities: Community[];
}

export interface SearchItem {
  id: number;
  type: 'user' | 'post' | 'community';
  title?: string;
  content?: string;
  name?: string;
  description?: string;
  created_at: string;
  [key: string]: any;
}

// Auth Types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  username: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangeEmailRequest {
  new_email: string;
}

// Onboarding Types
export interface OnboardingData {
  age_range: string;
  field_of_study: string[];
  academic_level: string;
  university?: string;
  preferences?: string[];
}

// API Error Types
export interface ApiError extends Error {
  status: number;
  details?: any;
  type: string;
  originalError?: Error;
}

export type ApiErrorType = 
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'CONFLICT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR'
  | 'CONNECTION_ERROR'
  | 'UNKNOWN_ERROR'
  | 'API_ERROR';

// Form Types
export interface CreatePostRequest {
  title: string;
  content: string;
  image?: string;
}

export interface CreateCommunityRequest {
  name: string;
  description: string;
  category?: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  username?: string;
  bio?: string;
  location?: string;
  field?: string;
  avatar_url?: string;
}

export interface UpdateSettingsRequest {
  email_notifications?: boolean;
  push_notifications?: boolean;
  sound_vibration?: boolean;
  location_services?: boolean;
  language?: string;
  show_activity_status?: boolean;
  show_last_seen?: boolean;
  allow_direct_messages?: boolean;
  allow_connection_requests?: boolean;
  community_posts_visibility?: string;
  photo_upload_restriction?: string;
  allowed_photo_sources?: string[];
}
