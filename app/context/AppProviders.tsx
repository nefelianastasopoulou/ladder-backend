import React, { ReactNode } from 'react';
import { ApplicationsProvider } from './ApplicationsContext';
import { FavoritesProvider } from './FavoritesContext';
import { FollowProvider } from './FollowContext';
import { LanguageProvider } from './LanguageContext';
import { NotificationsProvider } from './NotificationsContext';
import { RecommendationsProvider } from './RecommendationsContext';
import { UserProvider } from './UserContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Combined context providers to reduce nesting and improve performance
 * Order matters: UserProvider should be near the top as other providers may depend on user data
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LanguageProvider>
      <UserProvider>
        <FavoritesProvider>
          <ApplicationsProvider>
            <FollowProvider>
              <NotificationsProvider>
                <RecommendationsProvider>
                  {children}
                </RecommendationsProvider>
              </NotificationsProvider>
            </FollowProvider>
          </ApplicationsProvider>
        </FavoritesProvider>
      </UserProvider>
    </LanguageProvider>
  );
}
