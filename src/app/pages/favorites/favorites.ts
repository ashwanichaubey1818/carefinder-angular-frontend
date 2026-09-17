import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  forkJoin,
  timeout
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  Hospital
} from '../../data/hospitals';

import {
  FavoriteApiService
} from '../../services/favorite-api.service';

import {
  AuthService
} from '../../services/auth.service';

@Component({
  selector: 'app-favorites',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './favorites.html',

  styleUrl:
    './favorites.css'
})
export class Favorites {
  private readonly destroyRef =
    inject(DestroyRef);

  private readonly favoriteApi =
    inject(FavoriteApiService);

  private readonly auth =
    inject(AuthService);

  readonly favoriteHospitals =
    signal<Hospital[]>([]);

  readonly favoriteIds =
    computed(() =>
      this.favoriteHospitals().map(
        hospital =>
          hospital.id
      )
    );

  readonly loading =
    signal(true);

  readonly clearing =
    signal(false);

  readonly removingIds =
    signal<number[]>([]);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  private messageTimer:
    ReturnType<typeof setTimeout> |
    undefined;


  /* =========================================
     CONSTRUCTOR
  ========================================= */

  constructor() {
    this.loadFavorites();
  }


  /* =========================================
     LOAD FAVORITES FROM BACKEND
  ========================================= */

  loadFavorites(): void {
    if (
      !this.auth.currentUser()
    ) {
      this.favoriteHospitals.set([]);

      this.loading.set(false);

      this.errorMessage.set(
        'Saved hospitals dekhne ke liye please sign in karein.'
      );

      return;
    }

    this.loading.set(true);

    this.errorMessage.set('');

    this.favoriteApi
      .getFavorites()
      .pipe(
        timeout(15000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: hospitals => {
          this.favoriteHospitals.set(
            hospitals
          );

          this.loading.set(false);

          this.errorMessage.set('');
        },

        error: error => {
          console.error(
            'Favorites loading error:',
            error
          );

          this.favoriteHospitals.set([]);

          this.loading.set(false);

          this.errorMessage.set(
            'Saved hospitals load nahi hue. Please sign in again or retry.'
          );
        }
      });
  }


  /* =========================================
     REMOVE ONE FAVORITE
  ========================================= */

  removeFavorite(
    hospitalId: number
  ): void {
    if (
      this.isRemoving(
        hospitalId
      )
    ) {
      return;
    }

    this.setRemoving(
      hospitalId,
      true
    );

    this.favoriteApi
      .removeFavorite(
        hospitalId
      )
      .pipe(
        timeout(15000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: () => {
          this.favoriteHospitals.update(
            hospitals =>
              hospitals.filter(
                hospital =>
                  hospital.id !==
                  hospitalId
              )
          );

          this.setRemoving(
            hospitalId,
            false
          );

          this.showSuccessMessage(
            'Hospital saved list se remove ho gaya.'
          );
        },

        error: error => {
          console.error(
            'Favorite remove error:',
            error
          );

          this.setRemoving(
            hospitalId,
            false
          );

          this.errorMessage.set(
            'Hospital remove nahi hua. Please try again.'
          );
        }
      });
  }


  /* =========================================
     CLEAR ALL FAVORITES
  ========================================= */

  clearFavorites(): void {
    const hospitals =
      this.favoriteHospitals();

    if (
      hospitals.length === 0 ||

      this.clearing()
    ) {
      return;
    }

    this.clearing.set(true);

    this.errorMessage.set('');

    const removeRequests =
      hospitals.map(
        hospital =>
          this.favoriteApi
            .removeFavorite(
              hospital.id
            )
      );

    forkJoin(
      removeRequests
    )
      .pipe(
        timeout(30000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: () => {
          this.favoriteHospitals.set([]);

          this.clearing.set(false);

          this.showSuccessMessage(
            'All saved hospitals have been removed.'
          );
        },

        error: error => {
          console.error(
            'Clear favorites error:',
            error
          );

          this.clearing.set(false);

          this.errorMessage.set(
            'Some hospitals could not be removed. The list is being refreshed.'
          );

          this.loadFavorites();
        }
      });
  }


  /* =========================================
     CHECK REMOVE STATUS
  ========================================= */

  isRemoving(
    hospitalId: number
  ): boolean {
    return this.removingIds()
      .includes(
        hospitalId
      );
  }


  private setRemoving(
    hospitalId: number,
    removing: boolean
  ): void {
    this.removingIds.update(
      ids => {
        if (removing) {
          if (
            ids.includes(
              hospitalId
            )
          ) {
            return ids;
          }

          return [
            ...ids,
            hospitalId
          ];
        }

        return ids.filter(
          id =>
            id !== hospitalId
        );
      }
    );
  }


  /* =========================================
     SUCCESS MESSAGE
  ========================================= */

  private showSuccessMessage(
    message: string
  ): void {
    this.successMessage.set(
      message
    );

    this.errorMessage.set('');

    if (
      this.messageTimer
    ) {
      clearTimeout(
        this.messageTimer
      );
    }

    this.messageTimer =
      setTimeout(() => {
        this.successMessage.set('');
      }, 3000);
  }
}