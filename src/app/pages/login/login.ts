import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../services/auth.service';

@Component({
  selector: 'app-login',

  imports: [
    RouterLink,
    ReactiveFormsModule
  ],

  templateUrl:
    './login.html',

  styleUrl:
    '../../styles/auth.css'
})
export class Login {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly auth =
    inject(AuthService);

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute);

  private readonly returnUrl =
    this.readReturnUrl();

  readonly showPassword =
    signal(false);

  readonly submitting =
    signal(false);

  readonly message =
    signal('');

  readonly messageType =
    signal<
      'success' |
      'error' |
      ''
    >('');

  readonly loginForm =
    this.formBuilder
      .nonNullable
      .group({
        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8)
          ]
        ],

        remember: [
          false
        ]
      });


  /* =========================================
     LOGIN SUBMIT
  ========================================= */

  submit(): void {
    this.message.set('');

    this.messageType.set('');

    if (this.loginForm.invalid) {
      this.loginForm
        .markAllAsTouched();

      this.messageType.set(
        'error'
      );

      this.message.set(
        'Please enter a valid email and password.'
      );

      return;
    }

    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);

    const {
      email,
      password,
      remember
    } =
      this.loginForm
        .getRawValue();

    this.auth
      .login(
        email,
        password,
        remember
      )
      .subscribe({
        next: result => {
          this.submitting.set(false);

          this.messageType.set(
            result.success
              ? 'success'
              : 'error'
          );

          this.message.set(
            result.message
          );

          if (result.success) {
            void this.router
              .navigateByUrl(
                this.returnUrl
              );
          }
        },

        error: () => {
          this.submitting.set(false);

          this.messageType.set(
            'error'
          );

          this.message.set(
            'Unable to complete login.'
          );
        }
      });
  }


  /* =========================================
     SAFE RETURN URL
  ========================================= */

  private readReturnUrl(): string {
    const requestedUrl =
      this.route
        .snapshot
        .queryParamMap
        .get('returnUrl');

    if (!requestedUrl) {
      return '/hospitals';
    }

    /*
     * Only internal Angular routes are
     * allowed. This prevents redirecting
     * users to an external website.
     */

    const isInternalUrl =
      requestedUrl.startsWith('/') &&
      !requestedUrl.startsWith('//');

    const isAuthenticationPage =
      requestedUrl.startsWith(
        '/login'
      ) ||
      requestedUrl.startsWith(
        '/register'
      ) ||
      requestedUrl.startsWith(
        '/forgot-password'
      );

    if (
      !isInternalUrl ||
      isAuthenticationPage
    ) {
      return '/hospitals';
    }

    return requestedUrl;
  }
}