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
  selector: 'app-register',

  imports: [
    RouterLink,
    ReactiveFormsModule
  ],

  templateUrl: './register.html',

  styleUrl: '../../styles/auth.css'
})
export class Register {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly auth =
    inject(AuthService);

  private readonly router =
    inject(Router);

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

  readonly registerForm =
    this.formBuilder
      .nonNullable
      .group(
        {
          name: [
            '',
            [
              Validators.required,
              Validators.minLength(2)
            ]
          ],

          email: [
            '',
            [
              Validators.required,
              Validators.email
            ]
          ],

          mobile: [
            '',
            [
              Validators.required,

              Validators.pattern(
                /^[6-9]\d{9}$/
              )
            ]
          ],

          password: [
            '',
            [
              Validators.required,

              Validators.minLength(8),

              Validators.maxLength(72),

              Validators.pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
              )
            ]
          ],

          confirmPassword: [
            '',
            Validators.required
          ],

          terms: [
            false,
            Validators.requiredTrue
          ]
        },

        {
          validators:
            matchingPasswords
        }
      );

  submit(): void {
    this.message.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      this.messageType.set(
        'error'
      );

      this.message.set(
        'Please correct the highlighted fields.'
      );

      return;
    }

    if (this.submitting()) {
      return;
    }

    this.submitting.set(
      true
    );

    const value =
      this.registerForm
        .getRawValue();

    this.auth
      .register({
        name: value.name,

        email: value.email,

        mobile: value.mobile,

        password: value.password
      })
      .subscribe({
        next: result => {
          this.submitting.set(
            false
          );

          this.messageType.set(
            result.success
              ? 'success'
              : 'error'
          );

          this.message.set(
            result.message
          );

          if (result.success) {
            setTimeout(
              () => {
                void this.router.navigate([
                  '/hospitals'
                ]);
              },
              700
            );
          }
        },

        error: () => {
          this.submitting.set(
            false
          );

          this.messageType.set(
            'error'
          );

          this.message.set(
            'Unable to create the account.'
          );
        }
      });
  }
}