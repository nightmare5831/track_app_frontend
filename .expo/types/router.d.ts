/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/_sitemap` | `/admin` | `/admin/activities` | `/admin/equipment` | `/admin/operators` | `/equipment` | `/login` | `/operation` | `/register` | `/reports`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
