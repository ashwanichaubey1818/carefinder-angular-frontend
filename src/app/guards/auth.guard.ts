import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  map
} from 'rxjs';

import {
  AuthService
} from '../services/auth.service';

export const authGuard:
  CanActivateFn = (
    _route,
    state
  ) => {
    const auth =
      inject(AuthService);

    const router =
      inject(Router);

    const redirectToLogin = () =>
      router.createUrlTree(
        [
          '/login'
        ],
        {
          queryParams: {
            returnUrl:
              state.url
          }
        }
      );

    const hasUser =
      auth.currentUser() !== null;

    const hasAccessToken =
      auth.getAccessToken() !== null;

    const hasRefreshToken =
      auth.hasRefreshToken();

    if (
      hasUser &&
      (
        hasAccessToken ||
        hasRefreshToken
      )
    ) {
      return true;
    }

    if (!hasRefreshToken) {
      auth.clearSession();

      return redirectToLogin();
    }

    /*
     * A refresh token exists but user data
     * is missing. Validate the session by
     * loading the profile from the backend.
     */

    return auth
      .loadProfile()
      .pipe(
        map(result => {
          if (result.success) {
            return true;
          }

          auth.clearSession();

          return redirectToLogin();
        })
      );
  };