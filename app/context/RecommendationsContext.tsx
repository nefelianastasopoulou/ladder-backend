import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface UserPreference {
  category: string;
  weight: number; // 0-1, higher = more important
  lastUpdated: Date;
}

export interface UserBehavior {
  opportunityId: string;
  action: 'view' | 'like' | 'apply' | 'save' | 'share';
  timestamp: Date;
  category: string;
  location: string;
  field: string;
}

export interface OpportunityScore {
  opportunityId: string;
  score: number;
  factors: {
    categoryMatch: number;
    locationMatch: number;
    fieldMatch: number;
    recency: number;
    popularity: number;
  };
}

interface RecommendationsContextType {
  userPreferences: UserPreference[];
  userBehaviors: UserBehavior[];
  updatePreference: (category: string, weight: number) => void;
  trackBehavior: (behavior: Omit<UserBehavior, 'timestamp'>) => void;
  getOpportunityScore: (opportunity: any) => OpportunityScore;
  getPersonalizedOpportunities: (opportunities: any[]) => any[];
  getRecommendedCategories: () => string[];
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export const useRecommendations = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
};

interface RecommendationsProviderProps {
  children: ReactNode;
}

export const RecommendationsProvider: React.FC<RecommendationsProviderProps> = ({ children }) => {
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([
    { category: 'Internships', weight: 0.8, lastUpdated: new Date() },
    { category: 'Hackathons', weight: 0.6, lastUpdated: new Date() },
    { category: 'Scholarships', weight: 0.4, lastUpdated: new Date() },
    { category: 'Volunteering', weight: 0.3, lastUpdated: new Date() },
  ]);

  const [userBehaviors, setUserBehaviors] = useState<UserBehavior[]>([
    {
      opportunityId: '1',
      action: 'view',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      category: 'Internships',
      location: 'Athens, Greece',
      field: 'Technology'
    },
    {
      opportunityId: '2',
      action: 'like',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      category: 'Hackathons',
      location: 'Remote',
      field: 'Technology'
    },
    {
      opportunityId: '3',
      action: 'apply',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      category: 'Internships',
      location: 'Athens, Greece',
      field: 'Technology'
    }
  ]);

  // Update user preference for a category
  const updatePreference = (category: string, weight: number) => {
    setUserPreferences(prev => {
      const existing = prev.find(p => p.category === category);
      if (existing) {
        return prev.map(p => 
          p.category === category 
            ? { ...p, weight, lastUpdated: new Date() }
            : p
        );
      } else {
        return [...prev, { category, weight, lastUpdated: new Date() }];
      }
    });
  };

  // Track user behavior
  const trackBehavior = (behavior: Omit<UserBehavior, 'timestamp'>) => {
    const newBehavior: UserBehavior = {
      ...behavior,
      timestamp: new Date()
    };
    
    setUserBehaviors(prev => [newBehavior, ...prev]);
    
    // Update preferences based on behavior
    const categoryWeight = getCategoryWeightFromBehavior(behavior.action);
    updatePreference(behavior.category, categoryWeight);
  };

  // Calculate weight based on action type
  const getCategoryWeightFromBehavior = (action: string): number => {
    switch (action) {
      case 'apply': return 0.9;
      case 'like': return 0.7;
      case 'save': return 0.6;
      case 'share': return 0.5;
      case 'view': return 0.3;
      default: return 0.1;
    }
  };

  // Calculate opportunity score based on user preferences and behaviors
  const getOpportunityScore = (opportunity: any): OpportunityScore => {
    const now = new Date();
    const opportunityAge = now.getTime() - new Date(opportunity.postedDate).getTime();
    const daysOld = opportunityAge / (1000 * 60 * 60 * 24);

    // Category match score
    const categoryPreference = userPreferences.find(p => p.category === opportunity.category);
    const categoryMatch = categoryPreference ? categoryPreference.weight : 0.1;

    // Location match score (simple matching for now)
    const userLocations = [...new Set(userBehaviors.map(b => b.location))];
    const locationMatch = userLocations.includes(opportunity.location) ? 0.8 : 0.3;

    // Field match score
    const userFields = [...new Set(userBehaviors.map(b => b.field))];
    const fieldMatch = userFields.includes(opportunity.field) ? 0.7 : 0.4;

    // Recency score (newer = higher score)
    const recency = Math.max(0, 1 - (daysOld / 30)); // Decay over 30 days

    // Popularity score (based on mock data)
    const mockPopularity = Math.random() * 0.5 + 0.3; // Random between 0.3-0.8

    // Calculate weighted score
    const score = (
      categoryMatch * 0.4 +
      locationMatch * 0.2 +
      fieldMatch * 0.15 +
      recency * 0.15 +
      mockPopularity * 0.1
    );

    return {
      opportunityId: opportunity.id,
      score,
      factors: {
        categoryMatch,
        locationMatch,
        fieldMatch,
        recency,
        popularity: mockPopularity
      }
    };
  };

  // Get personalized opportunities sorted by score
  const getPersonalizedOpportunities = (opportunities: any[]): any[] => {
    // Ensure opportunities is an array before calling map
    if (!Array.isArray(opportunities)) {
      console.warn('getPersonalizedOpportunities received non-array:', opportunities);
      return [];
    }
    
    const scoredOpportunities = opportunities.map(opportunity => ({
      ...opportunity,
      score: getOpportunityScore(opportunity)
    }));

    return scoredOpportunities.sort((a, b) => b.score.score - a.score.score);
  };

  // Get recommended categories based on user behavior
  const getRecommendedCategories = (): string[] => {
    const categoryActions = userBehaviors.reduce((acc, behavior) => {
      const weight = getCategoryWeightFromBehavior(behavior.action);
      acc[behavior.category] = (acc[behavior.category] || 0) + weight;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryActions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
  };

  return (
    <RecommendationsContext.Provider value={{
      userPreferences,
      userBehaviors,
      updatePreference,
      trackBehavior,
      getOpportunityScore,
      getPersonalizedOpportunities,
      getRecommendedCategories
    }}>
      {children}
    </RecommendationsContext.Provider>
  );
}; 