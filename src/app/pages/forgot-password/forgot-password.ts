import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../services/auth.service';

function matchingPasswords(
  control: AbstractControl
): ValidationErrors | null {
  const password =
    control.get('password')?.value;

  const confirmPassword =
    control.get(
      'confirmPassword'
    )?.value;

  return password === confirmPassword
    ? null
    : {
        passwordMismatch: true
      };
}

@Component({
  selector: 'app-forgot-password',

  imports: [
    RouterLink,
    ReactiveFormsModule
  ],

  templateUrl:
    './forgot-password.html',

  styleUrl:
    '../../styles/auth.css'
})
export class ForgotPassword {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly auth =
    inject(AuthService);

  private readonly router =
    inject(Router);

  readonly step =
    signal<
      'email' |
      'reset' |
      'done'
    >('email');

  readonly message =
    signal('');

  readonly messageType =
    signal<
      'success' |
      'error' |
      ''
    >('');

  readonly showPassword =
    signal(false);

  readonly submitting =
    signal(false);

  private readonly resetToken =
    signal('');

  readonly emailForm =
    this.formBuilder
      .nonNullable
      .group({
        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ]
      });

  readonly resetForm =
    this.formBuilder
      .nonNullable
      .group(
        {
          password: [
            '',
            [
              Validators.required,

              Validators.minLength(8),

              Validators.maxLength(72),

              Validators.pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
              )
            ]
          ],

          confirmPassword: [
            '',
            Validators.required
          ]
        },

        {
          validators:
            matchingPasswords
        }
      );

  verifyEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm
        .markAllAsTouched();

      this.showMessage(
        'Enter a valid registered email address.',
        'error'
      );

      return;
    }

    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);

    this.message.set('');

    const email =
      this.emailForm
        .getRawValue()
        .email;

    this.auth
      .requestPasswordReset(
        email
      )
      .subscribe(result => {
        this.submitting.set(false);

        if (!result.success) {
          this.showMessage(
            result.message,
            'error'
          );

          return;
        }

        if (!result.resetToken) {
          this.showMessage(
            'Reset instructions were created, but no development token was returned.',
            'error'
          );

          return;
        }

        this.resetToken.set(
          result.resetToken
        );

        this.message.set('');

        this.messageType.set('');

        this.step.set('reset');
      });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm
        .markAllAsTouched();

      this.showMessage(
        'Use at least 8 characters with uppercase, lowercase, number and special symbol. Passwords must match.',
        'error'
      );

      return;
    }

    if (
      this.submitting() ||
      !this.resetToken()
    ) {
      return;
    }

    this.submitting.set(true);

    this.message.set('');

    const newPassword =
      this.resetForm
        .getRawValue()
        .password;

    this.auth
      .resetPassword(
        this.resetToken(),
        newPassword
      )
      .subscribe(result => {
        this.submitting.set(false);

        this.showMessage(
          result.message,

          result.success
            ? 'success'
            : 'error'
        );

        if (result.success) {
          this.resetToken.set('');

          this.step.set('done');

          setTimeout(
            () => {
              void this.router.navigate([
                '/login'
              ]);
            },
            1800
          );
        }
      });
  }

  private showMessage(
    text: string,
    type: 'success' | 'error'
  ): void {
    this.message.set(text);

    this.messageType.set(type);
  }
}