import React, { createContext, ReactNode, useContext, useState } from 'react';

interface FollowContextType {
  following: Set<string>;
  followers: Set<string>;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
  isFollowedBy: (userId: string) => boolean;
}

const FollowContext = createContext<FollowContextType | undefined>(undefined);

export const useFollow = () => {
  const context = useContext(FollowContext);
  if (context === undefined) {
    throw new Error('useFollow must be used within a FollowProvider');
  }
  return context;
};

interface FollowProviderProps {
  children: ReactNode;
}

export const FollowProvider: React.FC<FollowProviderProps> = ({ children }) => {
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followers, setFollowers] = useState<Set<string>>(new Set());

  const followUser = (userId: string) => {
    setFollowing(prev => {
      const newFollowing = new Set(prev);
      newFollowing.add(userId);
      return newFollowing;
    });
  };

  const unfollowUser = (userId: string) => {
    setFollowing(prev => {
      const newFollowing = new Set(prev);
      newFollowing.delete(userId);
      return newFollowing;
    });
  };

  const isFollowing = (userId: string) => {
    return following.has(userId);
  };

  const isFollowedBy = (userId: string) => {
    return followers.has(userId);
  };

  return (
    <FollowContext.Provider value={{ 
      following, 
      followers, 
      followUser, 
      unfollowUser, 
      isFollowing, 
      isFollowedBy 
    }}>
      {children}
    </FollowContext.Provider>
  );
}; 