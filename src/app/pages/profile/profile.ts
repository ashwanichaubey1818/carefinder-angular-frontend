import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  Hospital
} from '../../data/hospitals';

import {
  AuthService
} from '../../services/auth.service';

import {
  FavoriteApiService
} from '../../services/favorite-api.service';

import {
  RecentlyViewedService
} from '../../services/recently-viewed.service';

@Component({
  selector: 'app-profile',

  imports: [
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl:
    './profile.html',

  styleUrl:
    './profile.css'
})
export class Profile
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  readonly auth =
    inject(AuthService);

  readonly favoriteApi =
    inject(FavoriteApiService);

  readonly recentlyViewed =
    inject(RecentlyViewedService);

  readonly editing =
    signal(false);

  readonly loading =
    signal(false);

  readonly saving =
    signal(false);

  readonly favoritesLoading =
    signal(false);

  readonly favoritesError =
    signal('');

  readonly message =
    signal('');

  readonly messageType =
    signal<
      'success' |
      'error' |
      ''
    >('');

  readonly savedHospitals =
    signal<Hospital[]>([]);

  readonly user =
    computed(
      () => this.auth.currentUser()
    );

  readonly initials =
    computed(() => {
      return (
        this.user()
          ?.name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map(part =>
            part[0].toUpperCase()
          )
          .join('') ?? 'CF'
      );
    });

  readonly savedHospitalsCount =
    computed(() => {
      if (this.favoritesLoading()) {
        return (
          this.user()?.favoriteCount ??
          this.savedHospitals().length
        );
      }

      return this.savedHospitals().length;
    });

  readonly recentlyViewedCount =
    computed(() => {
      if (
        this.recentlyViewed.loading() ||
        this.recentlyViewed.errorMessage()
      ) {
        return (
          this.user()
            ?.recentlyViewedCount ??
          this.recentlyViewed
            .records()
            .length
        );
      }

      return this.recentlyViewed
        .records()
        .length;
    });

  readonly memberSince =
    computed(() => {
      const createdAt =
        this.user()?.createdAt;

      if (!createdAt) {
        return 'Recently joined';
      }

      return new Intl.DateTimeFormat(
        'en-IN',
        {
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC'
        }
      ).format(
        new Date(createdAt)
      );
    });

  readonly profileForm =
    this.formBuilder
      .nonNullable
      .group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2)
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

        city: [
          ''
        ],

        insuranceProvider: [
          ''
        ]
      });

  ngOnInit(): void {
    this.loadAccount();

    this.loadSavedHospitals();
  }

  loadAccount(): void {
    this.loading.set(true);

    this.message.set('');

    this.auth
      .loadProfile()
      .subscribe(result => {
        this.loading.set(false);

        if (!result.success) {
          this.messageType.set(
            'error'
          );

          this.message.set(
            result.message
          );
        }
      });
  }

  loadSavedHospitals(): void {
    this.favoritesLoading.set(true);

    this.favoritesError.set('');

    this.favoriteApi
      .getFavorites()
      .subscribe({
        next: hospitals => {
          this.savedHospitals.set(
            hospitals
          );

          this.favoritesLoading.set(
            false
          );
        },

        error: () => {
          this.savedHospitals.set([]);

          this.favoritesLoading.set(
            false
          );

          this.favoritesError.set(
            'Saved hospitals could not be loaded.'
          );
        }
      });
  }

  startEditing(): void {
    const activeUser =
      this.user();

    if (!activeUser) {
      return;
    }

    this.profileForm.setValue({
      name:
        activeUser.name,

      mobile:
        activeUser.mobile,

      city:
        activeUser.city ?? '',

      insuranceProvider:
        activeUser.insuranceProvider ??
        ''
    });

    this.message.set('');

    this.messageType.set('');

    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);

    this.message.set('');

    this.messageType.set('');
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm
        .markAllAsTouched();

      this.messageType.set(
        'error'
      );

      this.message.set(
        'Please correct the highlighted details.'
      );

      return;
    }

    if (this.saving()) {
      return;
    }

    this.saving.set(true);

    this.message.set('');

    this.auth
      .updateProfile(
        this.profileForm
          .getRawValue()
      )
      .subscribe(result => {
        this.saving.set(false);

        this.messageType.set(
          result.success
            ? 'success'
            : 'error'
        );

        this.message.set(
          result.message
        );

        if (result.success) {
          this.editing.set(false);
        }
      });
  }
}