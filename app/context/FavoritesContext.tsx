import React, { createContext, ReactNode, useContext, useState } from 'react';

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (opportunityId: string) => void;
  isFavorite: (opportunityId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (opportunityId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(opportunityId)) {
        newFavorites.delete(opportunityId);
      } else {
        newFavorites.add(opportunityId);
      }
      return newFavorites;
    });
  };

  const isFavorite = (opportunityId: string) => {
    return favorites.has(opportunityId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}; 