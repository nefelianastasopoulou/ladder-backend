// Frontend Performance Optimization Utilities
// This module provides utilities to optimize React Native performance

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Image } from 'react-native';

// Debounce utility for search and API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoized image component with optimization
export const OptimizedImage = ({ 
  source, 
  style, 
  resizeMode = 'cover',
  ...props 
}: any) => {
  const imageRef = useRef<Image>(null);

  // Preload image for better performance
  useEffect(() => {
    if (source?.uri) {
      Image.prefetch(source.uri).catch(() => {
        // Handle prefetch errors silently
      });
    }
  }, [source?.uri]);

  return (
    <Image
      ref={imageRef}
      source={source}
      style={style}
      resizeMode={resizeMode}
      fadeDuration={200}
      {...props}
    />
  );
};

// Hook for optimized list rendering
export const useOptimizedList = <T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string,
  options: {
    initialNumToRender?: number;
    maxToRenderPerBatch?: number;
    windowSize?: number;
    removeClippedSubviews?: boolean;
    getItemLayout?: (data: T[] | null | undefined, index: number) => { length: number; offset: number; index: number };
  } = {}
) => {
  const {
    initialNumToRender = 10,
    maxToRenderPerBatch = 5,
    windowSize = 10,
    removeClippedSubviews = true,
    getItemLayout
  } = options;

  const optimizedProps = useMemo(() => ({
    keyExtractor,
    initialNumToRender,
    maxToRenderPerBatch,
    windowSize,
    removeClippedSubviews,
    getItemLayout,
    // Performance optimizations
    updateCellsBatchingPeriod: 50,
    disableVirtualization: false,
  }), [keyExtractor, initialNumToRender, maxToRenderPerBatch, windowSize, removeClippedSubviews, getItemLayout]);

  return optimizedProps;
};

// Hook for API call optimization
export const useOptimizedAPI = () => {
  const requestCache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const makeRequest = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> => {
    // Check cache first
    if (useCache) {
      const cached = requestCache.current.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    // Make request
    const data = await requestFn();
    
    // Cache result
    if (useCache) {
      requestCache.current.set(key, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      requestCache.current.delete(key);
    } else {
      requestCache.current.clear();
    }
  }, []);

  return { makeRequest, clearCache };
};

// Hook for optimized state updates
export const useOptimizedState = <T>(initialState: T) => {
  const stateRef = useRef<T>(initialState);
  const [, forceUpdate] = useRef(0);

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    const nextState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(stateRef.current)
      : newState;
    
    if (stateRef.current !== nextState) {
      stateRef.current = nextState;
      forceUpdate.current += 1;
    }
  }, []);

  return [stateRef.current, setState] as const;
};

// Image loading optimization
export const preloadImages = async (imageUrls: string[]): Promise<void> => {
  const preloadPromises = imageUrls.map(url => 
    Image.prefetch(url).catch(() => {
      // Handle individual image prefetch failures
    })
  );
  
  await Promise.allSettled(preloadPromises);
};

// Bundle size optimization - lazy loading
export const lazyImport = <T>(importFn: () => Promise<T>) => {
  let module: T | null = null;
  let promise: Promise<T> | null = null;

  return () => {
    if (module) return Promise.resolve(module);
    if (promise) return promise;
    
    promise = importFn().then(m => {
      module = m;
      return m;
    });
    
    return promise;
  };
};

// Memory optimization - cleanup utilities
export const useCleanup = (cleanupFn: () => void) => {
  useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
};

// Performance monitoring
export const measurePerformance = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (__DEV__) {
      console.log(`Performance [${name}]: ${end - start}ms`);
    }
    
    return result;
  }) as T;
};

// Virtual scrolling optimization
export const getItemLayout = (itemHeight: number) => 
  (data: any[] | null | undefined, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  });

// Text optimization for long content
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Color scheme optimization
export const getOptimizedColors = (isDark: boolean) => ({
  background: isDark ? '#1a1a1a' : '#ffffff',
  surface: isDark ? '#2a2a2a' : '#f8f9fa',
  text: isDark ? '#ffffff' : '#1a1a1a',
  textSecondary: isDark ? '#a0a0a0' : '#6b7280',
  border: isDark ? '#404040' : '#e5e7eb',
  primary: '#4f46e5',
  secondary: isDark ? '#6366f1' : '#8b5cf6',
});

// Animation optimization
export const useOptimizedAnimation = () => {
  const animationRef = useRef<any>(null);

  const startAnimation = useCallback((animation: any) => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
    animationRef.current = animation;
    animation.start();
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stopAnimation;
  }, [stopAnimation]);

  return { startAnimation, stopAnimation };
};
