import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';

import {
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError
} from 'rxjs';

import {
  environment
} from '../../environments/environment';

import {
  AuthService
} from '../services/auth.service';


/* =========================================
   SHARED REFRESH REQUEST

   Multiple API requests getting 401 at the
   same time will share one refresh request.
========================================= */

let refreshRequest$:
  Observable<string> | null = null;


/* =========================================
   ADD AUTHORIZATION HEADER
========================================= */

function addAccessToken(
  request: HttpRequest<unknown>,
  accessToken: string
): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization:
        `Bearer ${accessToken}`
    }
  });
}


/* =========================================
   AUTH INTERCEPTOR
========================================= */

export const authInterceptor:
  HttpInterceptorFn = (
    request,
    next
  ) => {
    const platformId =
      inject(PLATFORM_ID);

    const auth =
      inject(AuthService);


    /* =====================================
       SSR REQUEST

       Browser storage is unavailable during
       Angular server-side rendering.
    ====================================== */

    if (
      !isPlatformBrowser(
        platformId
      )
    ) {
      return next(request);
    }


    /* =====================================
       CHECK BACKEND URL
    ====================================== */

    const isBackendRequest =
      request.url.startsWith(
        environment.apiUrl
      );

    if (!isBackendRequest) {
      return next(request);
    }


    /* =====================================
       PUBLIC AUTH ENDPOINTS

       These requests do not require an
       access token and must not trigger
       token refresh.
    ====================================== */

    const publicAuthUrls = [
      `${environment.apiUrl}/auth/login`,

      `${environment.apiUrl}/auth/register`,

      `${environment.apiUrl}/auth/refresh`,

      `${environment.apiUrl}/auth/logout`,

      `${environment.apiUrl}/auth/forgot-password`,

      `${environment.apiUrl}/auth/reset-password`
    ];

    const isPublicAuthRequest =
      publicAuthUrls.some(
        url => request.url === url
      );

    if (isPublicAuthRequest) {
      return next(request);
    }


    /* =====================================
       ATTACH CURRENT ACCESS TOKEN
    ====================================== */

    const accessToken =
      auth.getAccessToken();

    const authenticatedRequest =
      accessToken
        ? addAccessToken(
            request,
            accessToken
          )
        : request;


    /* =====================================
       SEND REQUEST
    ====================================== */

    return next(
      authenticatedRequest
    ).pipe(
      catchError(error => {
        const isUnauthorized =
          error instanceof
            HttpErrorResponse &&
          error.status === 401;

        if (!isUnauthorized) {
          return throwError(
            () => error
          );
        }


        /* =================================
           NO REFRESH TOKEN

           User must sign in again.
        ================================= */

        if (!auth.hasRefreshToken()) {
          auth.clearSession();

          return throwError(
            () => error
          );
        }


        /* =================================
           CREATE ONE SHARED REFRESH REQUEST
        ================================= */

        if (!refreshRequest$) {
          refreshRequest$ =
            auth
              .refreshAccessToken()
              .pipe(
                finalize(() => {
                  refreshRequest$ =
                    null;
                }),

                shareReplay({
                  bufferSize: 1,

                  refCount: false
                })
              );
        }


        /* =================================
           RETRY ORIGINAL REQUEST

           The original failed request is
           sent again using the new token.
        ================================= */

        return refreshRequest$.pipe(
          switchMap(
            newAccessToken => {
              const retryRequest =
                addAccessToken(
                  request,
                  newAccessToken
                );

              return next(
                retryRequest
              );
            }
          ),

          catchError(
            refreshError => {
              auth.clearSession();

              return throwError(
                () => refreshError
              );
            }
          )
        );
      })
    );
  };