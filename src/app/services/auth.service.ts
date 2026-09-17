import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';

import {
  Observable,
  catchError,
  map,
  of,
  tap,
  throwError
} from 'rxjs';

import {
  environment
} from '../../environments/environment';


/* =========================================
   USER MODELS
========================================= */

export interface UserAccount {
  id?: string;

  name: string;

  email: string;

  mobile: string;

  city?: string;

  insuranceProvider?: string;

  role?:
    | 'USER'
    | 'HOSPITAL_STAFF'
    | 'ADMIN';

  createdAt?: string;

  favoriteCount?: number;

  recentlyViewedCount?: number;
}

export interface RegisterAccount {
  name: string;

  email: string;

  mobile: string;

  password: string;

  city?: string;

  insuranceProvider?: string;
}

export interface AuthResult {
  success: boolean;

  message: string;
}

export interface PasswordResetRequestResult
  extends AuthResult {

  resetToken?: string;
}


/* =========================================
   BACKEND RESPONSE MODELS
========================================= */

interface AuthResponse {
  accessToken: string;

  refreshToken: string;

  tokenType: string;

  expiresInSeconds: number;

  user: UserAccount;
}

interface PasswordResetRequestResponse {
  message: string;

  developmentResetToken?:
    | string
    | null;
}

interface MessageResponse {
  message: string;
}


/* =========================================
   AUTH SERVICE
========================================= */

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http =
    inject(HttpClient);

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly browser =
    isPlatformBrowser(
      this.platformId
    );

  private readonly authUrl =
    `${environment.apiUrl}/auth`;

  private readonly accessTokenKey =
    'carefinder_access_token';

  private readonly refreshTokenKey =
    'carefinder_refresh_token';

  private readonly userKey =
    'carefinder_user';

  readonly currentUser =
    signal<UserAccount | null>(
      this.readUser()
    );


  /* =========================================
     REGISTER
  ========================================= */

  register(
    account: RegisterAccount
  ): Observable<AuthResult> {
    const request = {
      name:
        account.name.trim(),

      email:
        account.email
          .trim()
          .toLowerCase(),

      mobile:
        account.mobile.trim(),

      password:
        account.password,

      city:
        account.city?.trim() ?? '',

      insuranceProvider:
        account.insuranceProvider ?? ''
    };

    return this.http
      .post<AuthResponse>(
        `${this.authUrl}/register`,
        request
      )
      .pipe(
        tap(response => {
          this.saveAuthentication(
            response,
            false
          );
        }),

        map(response => ({
          success: true,

          message:
            `Welcome, ${response.user.name}!`
        })),

        catchError(error => {
          return of({
            success: false,

            message:
              this.readErrorMessage(
                error
              )
          });
        })
      );
  }


  /* =========================================
     LOGIN
  ========================================= */

  login(
    emailValue: string,
    password: string,
    remember: boolean
  ): Observable<AuthResult> {
    const request = {
      email:
        emailValue
          .trim()
          .toLowerCase(),

      password
    };

    return this.http
      .post<AuthResponse>(
        `${this.authUrl}/login`,
        request
      )
      .pipe(
        tap(response => {
          this.saveAuthentication(
            response,
            remember
          );
        }),

        map(response => ({
          success: true,

          message:
            `Welcome back, ${response.user.name}!`
        })),

        catchError(error => {
          return of({
            success: false,

            message:
              this.readErrorMessage(
                error
              )
          });
        })
      );
  }


  /* =========================================
     FORGOT PASSWORD
  ========================================= */

  requestPasswordReset(
    emailValue: string
  ): Observable<
    PasswordResetRequestResult
  > {
    const request = {
      email:
        emailValue
          .trim()
          .toLowerCase()
    };

    return this.http
      .post<PasswordResetRequestResponse>(
        `${this.authUrl}/forgot-password`,
        request
      )
      .pipe(
        map(response => ({
          success: true,

          message:
            response.message,

          resetToken:
            response
              .developmentResetToken ??
            undefined
        })),

        catchError(error => {
          return of({
            success: false,

            message:
              this.readErrorMessage(
                error
              )
          });
        })
      );
  }


  /* =========================================
     RESET PASSWORD
  ========================================= */

  resetPassword(
    resetToken: string,
    newPassword: string
  ): Observable<AuthResult> {
    const request = {
      token:
        resetToken.trim(),

      newPassword
    };

    return this.http
      .post<MessageResponse>(
        `${this.authUrl}/reset-password`,
        request
      )
      .pipe(
        tap(() => {
          /*
           * Any previous login session is
           * removed after changing password.
           */

          this.clearAuthentication();
        }),

        map(response => ({
          success: true,

          message:
            response.message ||
            'Password updated successfully.'
        })),

        catchError(error => {
          return of({
            success: false,

            message:
              this.readErrorMessage(
                error
              )
          });
        })
      );
  }


  /* =========================================
     ACCESS TOKEN
  ========================================= */

  getAccessToken():
    string | null {
    if (!this.browser) {
      return null;
    }

    return (
      localStorage.getItem(
        this.accessTokenKey
      ) ??
      sessionStorage.getItem(
        this.accessTokenKey
      )
    );
  }


  /* =========================================
     REFRESH TOKEN CHECK
  ========================================= */

  hasRefreshToken(): boolean {
    return (
      this.readRefreshToken() !== null
    );
  }


  /* =========================================
     REFRESH ACCESS TOKEN
  ========================================= */

  refreshAccessToken():
    Observable<string> {
    const refreshToken =
      this.readRefreshToken();

    if (!refreshToken) {
      this.clearAuthentication();

      return throwError(
        () =>
          new Error(
            'No refresh token is available.'
          )
      );
    }

    const remember =
      this.browser &&
      localStorage.getItem(
        this.refreshTokenKey
      ) !== null;

    return this.http
      .post<AuthResponse>(
        `${this.authUrl}/refresh`,
        {
          refreshToken
        }
      )
      .pipe(
        tap(response => {
          /*
           * Backend rotates both access
           * and refresh tokens.
           */

          this.saveAuthentication(
            response,
            remember
          );
        }),

        map(response =>
          response.accessToken
        ),

        catchError(error => {
          /*
           * Invalid or expired refresh
           * token means the complete
           * session must be removed.
           */

          this.clearAuthentication();

          return throwError(
            () => error
          );
        })
      );
  }


  /* =========================================
     PUBLIC SESSION CLEAR METHOD
  ========================================= */

  clearSession(): void {
    this.clearAuthentication();
  }


  /* =========================================
     LOAD USER PROFILE
  ========================================= */

  loadProfile():
    Observable<AuthResult> {
    return this.http
      .get<UserAccount>(
        `${environment.apiUrl}/users/me`
      )
      .pipe(
        tap(user => {
          this.currentUser.set(
            user
          );

          this.writeUser(
            user
          );
        }),

        map(() => ({
          success: true,

          message: ''
        })),

        catchError(error => {
          if (
            error instanceof
              HttpErrorResponse &&
            error.status === 401
          ) {
            this.clearAuthentication();
          }

          return of({
            success: false,

            message:
              this.readErrorMessage(
                error
              )
          });
        })
      );
  }


  /* =========================================
     UPDATE USER PROFILE
  ========================================= */

  updateProfile(
    changes: Pick<
      UserAccount,
      | 'name'
      | 'mobile'
      | 'city'
      | 'insuranceProvider'
    >
  ): Observable<AuthResult> {
    const request = {
      name:
        changes.name.trim(),

      mobile:
        changes.mobile.trim(),

      city:
        changes.city?.trim() ?? '',

      insuranceProvider:
        changes.insuranceProvider ?? ''
    };

    return this.http
      .put<UserAccount>(
        `${environment.apiUrl}/users/me`,
        request
      )
      .pipe(
        tap(user => {
          this.currentUser.set(
            user
          );

          this.writeUser(
            user
          );
        }),

        map(() => ({
          success: true,

          message:
            'Your profile has been updated.'
        })),

        catchError(error => {
          if (
            error instanceof
              HttpErrorResponse &&
            error.status === 401
          ) {
            this.clearAuthentication();
          }

          return of({
            success: false,

            message:
              this.readErrorMessage(
                error
              )
          });
        })
      );
  }


  /* =========================================
     LOGOUT
  ========================================= */

  logout(): void {
    const refreshToken =
      this.readRefreshToken();

    if (refreshToken) {
      this.http
        .post(
          `${this.authUrl}/logout`,
          {
            refreshToken
          }
        )
        .subscribe({
          error: () => {
            /*
             * Browser session will still
             * be removed if backend logout
             * request fails.
             */
          }
        });
    }

    this.clearAuthentication();
  }


  /* =========================================
     SAVE AUTHENTICATION
  ========================================= */

  private saveAuthentication(
    response: AuthResponse,
    remember: boolean
  ): void {
    if (!this.browser) {
      return;
    }

    const storage =
      remember
        ? localStorage
        : sessionStorage;

    const otherStorage =
      remember
        ? sessionStorage
        : localStorage;

    storage.setItem(
      this.accessTokenKey,
      response.accessToken
    );

    storage.setItem(
      this.refreshTokenKey,
      response.refreshToken
    );

    storage.setItem(
      this.userKey,
      JSON.stringify(
        response.user
      )
    );

    otherStorage.removeItem(
      this.accessTokenKey
    );

    otherStorage.removeItem(
      this.refreshTokenKey
    );

    otherStorage.removeItem(
      this.userKey
    );

    /*
     * Remove old frontend-only
     * authentication records.
     */

    localStorage.removeItem(
      'carefinder_users'
    );

    localStorage.removeItem(
      'carefinder_session'
    );

    sessionStorage.removeItem(
      'carefinder_session'
    );

    this.currentUser.set(
      response.user
    );
  }


  /* =========================================
     CLEAR AUTHENTICATION
  ========================================= */

  private clearAuthentication(): void {
    this.currentUser.set(null);

    if (!this.browser) {
      return;
    }

    for (
      const storage of [
        localStorage,
        sessionStorage
      ]
    ) {
      storage.removeItem(
        this.accessTokenKey
      );

      storage.removeItem(
        this.refreshTokenKey
      );

      storage.removeItem(
        this.userKey
      );

      storage.removeItem(
        'carefinder_session'
      );
    }
  }


  /* =========================================
     READ SAVED USER
  ========================================= */

  private readUser():
    UserAccount | null {
    if (!this.browser) {
      return null;
    }

    const storedUser =
      localStorage.getItem(
        this.userKey
      ) ??
      sessionStorage.getItem(
        this.userKey
      );

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(
        storedUser
      ) as UserAccount;
    } catch {
      return null;
    }
  }


  /* =========================================
     UPDATE SAVED USER
  ========================================= */

  private writeUser(
    user: UserAccount
  ): void {
    if (!this.browser) {
      return;
    }

    const storage =
      localStorage.getItem(
        this.accessTokenKey
      )
        ? localStorage
        : sessionStorage;

    storage.setItem(
      this.userKey,
      JSON.stringify(user)
    );
  }


  /* =========================================
     READ REFRESH TOKEN
  ========================================= */

  private readRefreshToken():
    string | null {
    if (!this.browser) {
      return null;
    }

    return (
      localStorage.getItem(
        this.refreshTokenKey
      ) ??
      sessionStorage.getItem(
        this.refreshTokenKey
      )
    );
  }


  /* =========================================
     BACKEND ERROR MESSAGE
  ========================================= */

  private readErrorMessage(
    error: unknown
  ): string {
    if (
      error instanceof HttpErrorResponse
    ) {
      if (error.status === 0) {
        return 'Backend is unavailable. Make sure Spring Boot is running on port 8080.';
      }

      const response =
        error.error as {
          message?: unknown;
        } | null;

      if (
        response &&
        typeof response.message ===
          'string'
      ) {
        return response.message;
      }

      if (error.status === 401) {
        return 'Your session has expired. Please sign in again.';
      }

      if (error.status === 429) {
        return 'Too many requests. Please wait before trying again.';
      }
    }

    return 'Something went wrong. Please try again.';
  }
}