// Enhanced Type Definitions for Better Type Safety
// This file provides comprehensive type definitions for the application

// Base types
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  username: string;
  full_name: string;
  is_admin: boolean;
}

export interface UserProfile extends BaseEntity {
  user_id: number;
  bio?: string;
  location?: string;
  field?: string;
  avatar_url?: string;
  avatar_key?: string;
}

export interface UserSettings extends BaseEntity {
  user_id: number;
  photo_upload_restriction: boolean;
  allowed_photo_sources: string[];
}

// Post types
export interface Post extends BaseEntity {
  title: string;
  content: string;
  category: string;
  author_id: number;
  community_id?: number;
  image_url?: string;
  image_key?: string;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
}

export interface PostWithDetails extends Post {
  author: User;
  author_profile?: UserProfile;
  community?: Community;
}

// Community types
export interface Community extends BaseEntity {
  name: string;
  description: string;
  is_public: boolean;
  created_by: number;
  member_count: number;
}

export interface CommunityMember extends BaseEntity {
  user_id: number;
  community_id: number;
  role: 'member' | 'moderator' | 'admin';
}

export interface CommunityWithDetails extends Community {
  creator: User;
  creator_profile?: UserProfile;
  members?: CommunityMember[];
}

// Opportunity types
export interface Opportunity extends BaseEntity {
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  deadline: string;
  created_by: number;
  image_url?: string;
  image_key?: string;
}

export interface OpportunityWithDetails extends Opportunity {
  creator: User;
  creator_profile?: UserProfile;
  application_count: number;
}

// Application types
export interface Application extends BaseEntity {
  user_id: number;
  opportunity_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
}

export interface ApplicationWithDetails extends Application {
  user: User;
  user_profile?: UserProfile;
  opportunity: Opportunity;
}

// Message types
export interface Message extends BaseEntity {
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
}

export interface Conversation extends BaseEntity {
  type: 'direct' | 'group';
  created_by: number;
  last_message_id?: number;
}

export interface ConversationParticipant extends BaseEntity {
  conversation_id: number;
  user_id: number;
}

export interface MessageWithDetails extends Message {
  sender: User;
  sender_profile?: UserProfile;
  conversation: Conversation;
}

// Like and Comment types
export interface Like extends BaseEntity {
  user_id: number;
  post_id: number;
}

export interface Comment extends BaseEntity {
  post_id: number;
  author_id: number;
  content: string;
  parent_id?: number;
}

export interface CommentWithDetails extends Comment {
  author: User;
  author_profile?: UserProfile;
  replies?: CommentWithDetails[];
}

// Follow types
export interface Follow extends BaseEntity {
  follower_id: number;
  following_id: number;
}

// Favorite types
export interface Favorite extends BaseEntity {
  user_id: number;
  opportunity_id: number;
}

// Report types
export interface Report extends BaseEntity {
  reporter_id: number;
  reported_type: 'user' | 'post' | 'community' | 'opportunity';
  reported_id: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

// Filter and Search types
export interface OpportunityFilters {
  category?: string;
  location?: string;
  duration?: string;
  createdBy?: number;
  isActive?: boolean;
}

export interface PostFilters {
  authorId?: number;
  communityId?: number;
  category?: string;
  isPublished?: boolean;
}

export interface CommunityFilters {
  isPublic?: boolean;
  createdBy?: number;
  hasMembers?: boolean;
}

export interface SearchFilters {
  query: string;
  type?: 'posts' | 'opportunities' | 'communities' | 'users';
  category?: string;
  location?: string;
}

// Form types
export interface CreatePostForm {
  title: string;
  content: string;
  category: string;
  communityId?: number;
  image?: File;
}

export interface CreateOpportunityForm {
  title: string;
  description: string;
  category: string;
  location: string;
  duration: string;
  deadline: string;
  image?: File;
}

export interface CreateCommunityForm {
  name: string;
  description: string;
  isPublic: boolean;
}

export interface UpdateProfileForm {
  bio?: string;
  location?: string;
  field?: string;
  avatar?: File;
}

// Notification types
export interface Notification extends BaseEntity {
  user_id: number;
  type: 'like' | 'comment' | 'follow' | 'application' | 'message' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  related_id?: number;
  related_type?: string;
}

// Statistics types
export interface UserStats {
  posts_count: number;
  opportunities_created: number;
  applications_count: number;
  followers_count: number;
  following_count: number;
}

export interface CommunityStats {
  members_count: number;
  posts_count: number;
  opportunities_count: number;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    caption: number;
  };
}

// Navigation types
export interface NavigationParams {
  Home: undefined;
  Profile: { userId?: number };
  Community: { communityId: number };
  PostDetails: { postId: number };
  OpportunityDetails: { opportunityId: number };
  CreatePost: undefined;
  CreateOpportunity: undefined;
  CreateCommunity: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Onboarding: undefined;
  Search: { query?: string };
  Notifications: undefined;
  Chats: undefined;
  Conversation: { conversationId: number };
  Applications: undefined;
  Favorites: undefined;
  Communities: undefined;
  CommunityMembers: { communityId: number };
  CommunitySettings: { communityId: number };
  UserProfile: { userId: number };
  PostOpportunity: undefined;
  MyOpportunities: undefined;
  ChangePassword: undefined;
  ChangeEmail: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  AdminPanel: undefined;
  EnterResetToken: undefined;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event types
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Performance types
export interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  bundleSize: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  appName: string;
  appVersion: string;
  debugMode: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePushNotifications: boolean;
}
