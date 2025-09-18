/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/community` | `/(tabs)/home` | `/(tabs)/profile` | `/_sitemap` | `/admin-panel` | `/applications` | `/change-email` | `/change-password` | `/chat` | `/chats` | `/communities` | `/community` | `/community-detail` | `/community-members` | `/community-settings` | `/context/AppProviders` | `/context/ApplicationsContext` | `/context/FavoritesContext` | `/context/FollowContext` | `/context/LanguageContext` | `/context/NotificationsContext` | `/context/RecommendationsContext` | `/context/UserContext` | `/conversation` | `/create-community` | `/create-post` | `/edit-profile` | `/enter-reset-token` | `/favourites` | `/forgot-password` | `/home` | `/login` | `/my-opportunities` | `/notifications` | `/onboarding` | `/opportunity-details` | `/post-details` | `/post-opportunity` | `/privacy-policy` | `/profile` | `/reset-password` | `/search` | `/settings` | `/signup` | `/terms-of-service` | `/user-profile`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
