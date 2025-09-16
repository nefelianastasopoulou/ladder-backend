// Export all types from the types directory
export * from './api';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// React Native specific types
export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

// Navigation types
export type RootStackParamList = {
  login: undefined;
  signup: undefined;
  onboarding: undefined;
  '(tabs)': undefined;
  favourites: undefined;
  applications: undefined;
  'user-profile': { userId?: number };
  chat: { conversationId: number };
  'post-opportunity': undefined;
  '+not-found': undefined;
};

export type TabParamList = {
  index: undefined;
  home: undefined;
  community: undefined;
  profile: undefined;
};

// Component prop types
export interface BaseComponentProps {
  children?: React.ReactNode;
  style?: any;
  testID?: string;
}

export interface LoadingProps extends BaseComponentProps {
  loading: boolean;
  message?: string;
}

export interface ErrorProps extends BaseComponentProps {
  error: string | null;
  onRetry?: () => void;
}

// Hook return types
export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePaginatedResult<T> extends UseApiResult<T[]> {
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'multiselect';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
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
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: any;
    h2: any;
    h3: any;
    body: any;
    caption: any;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  appName: string;
  appVersion: string;
  isDev: boolean;
  isDebug: boolean;
  features: {
    analytics: boolean;
    crashReporting: boolean;
    pushNotifications: boolean;
  };
  services: {
    sentryDsn: string;
    analyticsId: string;
  };
}
