import type {
    AuthResponse
} from '../types';
import { config, getApiUrlForExpoGo, validateConfig } from './config';
import SecureStorage from './secureStorage';

// Validate configuration on import
validateConfig();

const API_BASE_URL = getApiUrlForExpoGo();

// Fallback mock data for testing when API is not available
const MOCK_OPPORTUNITIES = [
  {
    id: 1,
    title: 'Software Engineering Internship',
    description: 'Join our team as a software engineering intern and work on exciting projects.',
    category: 'Internships',
    location: 'Athens',
    field: 'Technology',
    created_at: new Date().toISOString(),
    image: 'https://via.placeholder.com/300x200?text=Internship',
  },
  {
    id: 2,
    title: 'Hackathon 2024',
    description: 'Participate in our annual hackathon and showcase your coding skills.',
    category: 'Hackathons',
    location: 'Remote',
    field: 'Technology',
    created_at: new Date().toISOString(),
    image: 'https://via.placeholder.com/300x200?text=Hackathon',
  },
];

// Helper function to make API requests
const apiRequest = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Log API request in development only
  if (config.debugMode) {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
  }
  
  const requestConfig: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = await getStoredToken();
  if (token) {
    requestConfig.headers = {
      ...requestConfig.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for Railway
    
    const response = await fetch(url, {
      ...requestConfig,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Log API response in development only
    if (config.debugMode) {
      console.log(`API Response: ${response.status} ${response.statusText}`);
      console.log(`API URL: ${url}`);
      console.log(`API Headers:`, requestConfig.headers);
    }
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 200));
      
      // Handle Railway-specific errors
      if (text.includes('Application Error') || text.includes('Railway')) {
        throw new Error('Server is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    // Log API data in development only
    if (config.debugMode) {
      console.log(`API Data:`, data);
    }

    if (!response.ok) {
      // Enhanced error handling with specific error types
      const errorMessage = data.error?.message || data.error || `API request failed: ${response.status}`;
      const errorDetails = data.error?.details || null;
      
      console.error(`API Error: ${errorMessage}`, errorDetails);
      
      // Create more specific error objects with better error types
      const apiError = new Error(errorMessage);
      (apiError as any).status = response.status;
      (apiError as any).details = errorDetails;
      (apiError as any).type = data.error?.type || 'API_ERROR';
      
      // Add specific error handling for common HTTP status codes
      if (response.status === 401) {
        (apiError as any).type = 'AUTHENTICATION_ERROR';
        (apiError as any).message = 'Authentication failed. Please log in again.';
      } else if (response.status === 403) {
        (apiError as any).type = 'AUTHORIZATION_ERROR';
        (apiError as any).message = 'You do not have permission to perform this action.';
      } else if (response.status === 404) {
        (apiError as any).type = 'NOT_FOUND_ERROR';
        (apiError as any).message = 'The requested resource was not found.';
      } else if (response.status === 409) {
        (apiError as any).type = 'CONFLICT_ERROR';
        (apiError as any).message = 'This action conflicts with existing data.';
      } else if (response.status === 429) {
        (apiError as any).type = 'RATE_LIMIT_ERROR';
        (apiError as any).message = 'Too many requests. Please try again later.';
      } else if (response.status >= 500) {
        (apiError as any).type = 'SERVER_ERROR';
        (apiError as any).message = 'Server error. Please try again later.';
      }
      
      throw apiError;
    }

    return data;
  } catch (error) {
    console.error(`API Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`Full error:`, error);
    
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout - please check your internet connection');
        (timeoutError as any).type = 'TIMEOUT_ERROR';
        (timeoutError as any).status = 408;
        throw timeoutError;
      }
      if (error.message.includes('Network request failed')) {
        const networkError = new Error('Network error - please check your internet connection');
        (networkError as any).type = 'NETWORK_ERROR';
        (networkError as any).status = 0;
        throw networkError;
      }
      if (error.message.includes('Failed to fetch')) {
        const fetchError = new Error('Unable to connect to server - please check your internet connection');
        (fetchError as any).type = 'CONNECTION_ERROR';
        (fetchError as any).status = 0;
        throw fetchError;
      }
      if (error.message.includes('Application Error') || error.message.includes('Railway')) {
        const railwayError = new Error('Server is temporarily unavailable. Please try again later.');
        (railwayError as any).type = 'SERVER_UNAVAILABLE';
        (railwayError as any).status = 503;
        throw railwayError;
      }
      
      // If it's already an API error with type, preserve it
      if ((error as any).type) {
        throw error;
      }
      
      // For other errors, wrap them with a generic error type
      const genericError = new Error(error.message || 'An unexpected error occurred');
      (genericError as any).type = 'UNKNOWN_ERROR';
      (genericError as any).status = 0;
      (genericError as any).originalError = error;
      throw genericError;
    }
    
    // For non-Error objects
    const unknownError = new Error('An unexpected error occurred');
    (unknownError as any).type = 'UNKNOWN_ERROR';
    (unknownError as any).status = 0;
    (unknownError as any).originalError = error;
    throw unknownError;
  }
};

// Token storage functions using secure storage
const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStorage.getToken();
    
    // Validate token format and expiration
    if (token && SecureStorage.isValidToken(token)) {
      if (SecureStorage.isTokenExpired(token)) {
        console.log('Token expired, removing...');
        await SecureStorage.removeToken();
        return null;
      }
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const setStoredToken = async (token: string): Promise<void> => {
  try {
    if (SecureStorage.isValidToken(token)) {
      await SecureStorage.setToken(token);
    } else {
      console.error('Invalid token format');
    }
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

const removeStoredToken = async (): Promise<void> => {
  try {
    await SecureStorage.removeToken();
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Auth API
export const authAPI = {
  signUp: async (email: string, password: string, fullName: string, username: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, username }),
    });
    
    // Store the token
    if (response.token) {
      await setStoredToken(response.token);
    }
    
    return response;
  },

  signIn: async (emailOrUsername: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: emailOrUsername, password }),
    });
    
    // Store the token
    if (response.token) {
      await setStoredToken(response.token);
    }
    
    return response;
  },

  signOut: async () => {
    await removeStoredToken();
  },

  forgotPassword: async (email: string) => {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  changeEmail: async (newEmail: string) => {
    return await apiRequest('/auth/change-email', {
      method: 'POST',
      body: JSON.stringify({ new_email: newEmail }),
    });
  },

  verifyEmailChange: async (token: string) => {
    return await apiRequest('/auth/verify-email-change', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ 
        current_password: currentPassword, 
        new_password: newPassword 
      }),
    });
  },

  deleteAccount: async () => {
    return await apiRequest('/auth/delete-account', {
      method: 'DELETE',
    });
  },

  getCurrentUser: async () => {
    try {
      const token = await getStoredToken();
      if (!token) return null;
      
      const response = await apiRequest('/profile');
      return response;
    } catch (error) {
      await removeStoredToken();
      return null;
    }
  },
};

// Profile API
export const profileAPI = {
  getProfile: async () => {
    return await apiRequest('/profile');
  },

  updateProfile: async (profileData: {
    full_name?: string;
    username?: string;
    bio?: string;
    location?: string;
    field?: string;
    avatar_url?: string;
  }) => {
    return await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Onboarding API
export const onboardingAPI = {
  saveOnboardingData: async (onboardingData: {
    age_range: string;
    field_of_study: string[];
    academic_level: string;
    university?: string;
    preferences?: string[];
  }) => {
    try {
      const response = await apiRequest('/onboarding', {
        method: 'POST',
        body: JSON.stringify(onboardingData),
      });
      return response;
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      throw error;
    }
  },
};

// Opportunities API
export const opportunitiesAPI = {
  getOpportunities: async () => {
    try {
      const data = await apiRequest('/opportunities');
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    } catch (error) {
      // Log fallback to mock data in development only
      if (config.debugMode) {
        console.log('API not available, using mock data');
      }
      return MOCK_OPPORTUNITIES;
    }
  },

  getMyOpportunities: async () => {
    return await apiRequest('/opportunities/my');
  },

  createOpportunity: async (opportunityData: {
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
    is_external_application?: boolean;
  }) => {
    return await apiRequest('/opportunities', {
      method: 'POST',
      body: JSON.stringify(opportunityData),
    });
  },

  deleteOpportunity: async (opportunityId: number) => {
    return await apiRequest(`/opportunities/${opportunityId}`, {
      method: 'DELETE',
    });
  },
};

// Favorites API
export const favoritesAPI = {
  getFavorites: async () => {
    return await apiRequest('/favorites');
  },

  addToFavorites: async (opportunityId: number) => {
    return await apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: opportunityId }),
    });
  },

  removeFromFavorites: async (opportunityId: number) => {
    return await apiRequest(`/favorites/${opportunityId}`, {
      method: 'DELETE',
    });
  },
};

// Applications API
export const applicationsAPI = {
  getApplications: async () => {
    return await apiRequest('/applications');
  },

  applyForOpportunity: async (opportunityId: number, notes?: string) => {
    return await apiRequest('/applications', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: opportunityId, notes }),
    });
  },

  checkApplicationStatus: async (opportunityId: number) => {
    return await apiRequest(`/applications/check/${opportunityId}`);
  },

  removeApplication: async (applicationId: number) => {
    return await apiRequest(`/applications/${applicationId}`, {
      method: 'DELETE',
    });
  },

  updateApplicationStatus: async (applicationId: number, status: string) => {
    return await apiRequest(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Settings API
export const settingsAPI = {
  getSettings: async () => {
    return await apiRequest('/settings');
  },

  updateSettings: async (settings: {
    posts_on_profile_visibility?: string;
    show_online_status?: boolean;
    push_notifications?: boolean;
    email_notifications?: boolean;
    language?: string;
  }) => {
    return await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};


// Communities API
export const communitiesAPI = {
  getCommunities: async () => {
    return await apiRequest('/communities');
  },

  getCommunityPosts: async (communityId: number) => {
    return await apiRequest(`/communities/${communityId}/posts`);
  },
  createCommunityPost: async (communityId: number, postData: {
    title: string;
    content: string;
    image?: string;
  }) => {
    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    
    if (postData.image) {
      formData.append('image', {
        uri: postData.image,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
    }

    return await apiRequest(`/communities/${communityId}/posts`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  createPlatformPost: async (postData: {
    title: string;
    content: string;
    image?: string;
  }) => {
    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    
    if (postData.image) {
      formData.append('image', {
        uri: postData.image,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
    }

    return await apiRequest('/posts', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateCommunity: async (communityId: number, communityData: {
    name?: string;
    description?: string;
    is_public?: boolean;
  }) => {
    return await apiRequest(`/communities/${communityId}`, {
      method: 'PUT',
      body: JSON.stringify(communityData),
    });
  },

  createCommunity: async (communityData: {
    name: string;
    description: string;
    category?: string;
  }) => {
    return await apiRequest('/communities', {
      method: 'POST',
      body: JSON.stringify(communityData),
    });
  },

  joinCommunity: async (communityId: number) => {
    return await apiRequest(`/communities/${communityId}/join`, {
      method: 'POST',
    });
  },

  leaveCommunity: async (communityId: number) => {
    return await apiRequest(`/communities/${communityId}/leave`, {
      method: 'POST',
    });
  },

  deleteCommunity: async (communityId: number) => {
    return await apiRequest(`/communities/${communityId}`, {
      method: 'DELETE',
    });
  },
};

// Search API
export const searchAPI = {
  searchUsers: async (query: string) => {
    return await apiRequest(`/search/users?q=${encodeURIComponent(query)}`);
  },

  searchPosts: async (query: string) => {
    return await apiRequest(`/search/posts?q=${encodeURIComponent(query)}`);
  },

  searchCommunities: async (query: string) => {
    return await apiRequest(`/search/communities?q=${encodeURIComponent(query)}`);
  },

  searchAll: async (query: string) => {
    return await apiRequest(`/search/all?q=${encodeURIComponent(query)}`);
  },
};

// Chat API
export const chatAPI = {
  getConversations: async () => {
    return await apiRequest('/conversations');
  },

  createIndividualConversation: async (otherUserId: number) => {
    return await apiRequest('/conversations/individual', {
      method: 'POST',
      body: JSON.stringify({ other_user_id: otherUserId }),
    });
  },

  getMessages: async (conversationId: number) => {
    return await apiRequest(`/conversations/${conversationId}/messages`);
  },

  sendMessage: async (conversationId: number, content: string, messageType: string = 'text') => {
    return await apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, message_type: messageType }),
    });
  },
};

// Admin API
export const adminAPI = {
  // Get all data for admin management
  getUsers: async () => {
    return await apiRequest('/admin/users');
  },

  getCommunities: async () => {
    return await apiRequest('/admin/communities');
  },

  getPosts: async () => {
    return await apiRequest('/admin/posts');
  },

  // User management
  makeUserAdmin: async (userId: number) => {
    return await apiRequest('/auth/make-admin', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Delete operations
  deleteUser: async (userId: number) => {
    return await apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  deleteCommunity: async (communityId: number) => {
    return await apiRequest(`/admin/communities/${communityId}`, {
      method: 'DELETE',
    });
  },

  deletePost: async (postId: number) => {
    return await apiRequest(`/admin/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  getReports: async () => {
    return await apiRequest('/admin/reports');
  },

  updateReportStatus: async (reportId: number, status: string) => {
    return await apiRequest(`/admin/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Reports API
export const reportsAPI = {
  submitReport: async (reportData: {
    reported_type: 'user' | 'community' | 'post';
    reported_id: number;
    reason: string;
    description?: string;
  }) => {
    return await apiRequest('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },
};

