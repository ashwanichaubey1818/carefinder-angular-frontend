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

export const guestGuard:
  CanActivateFn = () => {
    const auth =
      inject(AuthService);

    const router =
      inject(Router);

    const redirectToProfile = () =>
      router.createUrlTree([
        '/profile'
      ]);

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
      return redirectToProfile();
    }

    if (!hasRefreshToken) {
      return true;
    }

    /*
     * Refresh token exists but browser
     * user data is missing. Validate the
     * session before opening a guest page.
     */

    return auth
      .loadProfile()
      .pipe(
        map(result => {
          if (result.success) {
            return redirectToProfile();
          }

          auth.clearSession();

          return true;
        })
      );
  };