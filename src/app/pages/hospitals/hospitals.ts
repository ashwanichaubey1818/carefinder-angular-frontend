import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  forkJoin,
  Observable,
  timeout
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  HOSPITALS,
  INSURANCE_PROVIDERS,
  Hospital
} from '../../data/hospitals';

import {
  HospitalComparisonService
} from '../../services/hospital-comparison.service';

import {
  HospitalApiService
} from '../../services/hospital-api.service';

import {
  FavoriteApiService
} from '../../services/favorite-api.service';

import {
  AuthService
} from '../../services/auth.service';

@Component({
  selector: 'app-hospitals',

  standalone: true,

  imports: [
    RouterLink,
    FormsModule
  ],

  templateUrl:
    './hospitals.html',

  styleUrl:
    './hospitals.css'
})
export class Hospitals {
  private readonly route =
    inject(ActivatedRoute);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly changeDetector =
    inject(ChangeDetectorRef);

  private readonly hospitalApi =
    inject(HospitalApiService);

  private readonly favoriteApi =
    inject(FavoriteApiService);

  private readonly auth =
    inject(AuthService);

  readonly comparisonService =
    inject(HospitalComparisonService);

  readonly insuranceProviders =
    INSURANCE_PROVIDERS;

  readonly favoriteIds =
    signal<number[]>([]);

  readonly favoriteBusyIds =
    signal<number[]>([]);

  hospitals: Hospital[] = [];

  filteredHospitals: Hospital[] = [];

  loading = true;

  loadError = '';

  location = '';

  insurance = '';

  distance = 20;

  emergencyOnly = false;

  open24x7Only = false;

  rating4Plus = false;

  userLatitude: number | null = null;

  userLongitude: number | null = null;

  hospitalDistances:
    Record<number, number> = {};

  sortOption = 'recommended';

  locationStatus = '';

  visibleCount = 12;

  compareMessage = '';

  favoriteMessage = '';

  private compareMessageTimer:
    ReturnType<typeof setTimeout> |
    undefined;

  private favoriteMessageTimer:
    ReturnType<typeof setTimeout> |
    undefined;


  /* =========================================
     CONSTRUCTOR
  ========================================= */

  constructor() {
    this.route.queryParams
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(parameters => {
        this.location =
          typeof parameters['location'] ===
            'string'
            ? parameters['location']
            : '';

        this.insurance =
          typeof parameters['insurance'] ===
            'string'
            ? parameters['insurance']
            : '';

        this.loadHospitals();
      });

    this.loadFavorites();
  }


  /* =========================================
     DIRECTORY STATISTICS
  ========================================= */

  get stateCount(): number {
    return new Set(
      this.hospitals.map(
        hospital =>
          hospital.state
      )
    ).size;
  }


  /* =========================================
     VISIBLE HOSPITALS
  ========================================= */

  get visibleHospitals():
    Hospital[] {
    return this.filteredHospitals.slice(
      0,
      this.visibleCount
    );
  }


  get hasMoreHospitals(): boolean {
    return (
      this.visibleCount <
      this.filteredHospitals.length
    );
  }


  /* =========================================
     LOAD FIRST HOSPITAL PAGE
  ========================================= */

  private loadHospitals(): void {
    this.loading = true;

    this.loadError = '';

    this.changeDetector
      .markForCheck();

    this.hospitalApi
      .search({
        page: 0,
        size: 50
      })
      .pipe(
        timeout(15000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: response => {
          const firstPageHospitals =
            response.content ?? [];

          if (
            firstPageHospitals.length === 0
          ) {
            this.hospitals = [
              ...HOSPITALS
            ];

            this.loading = false;

            this.loadError =
              'Backend response mein hospital data nahi mila. Local data dikhaya ja raha hai.';

            this.calculateDistances(
              this.hospitals
            );

            this.searchHospitals();

            this.changeDetector
              .markForCheck();

            return;
          }

          /*
           * First 50 hospitals immediately
           * display honge.
           */

          this.hospitals =
            firstPageHospitals;

          this.loading = false;

          this.calculateDistances(
            this.hospitals
          );

          this.searchHospitals();

          this.changeDetector
            .markForCheck();

          /*
           * Remaining pages background
           * mein load hongi.
           */

          if (
            response.totalPages > 1
          ) {
            this.loadRemainingPages(
              response.totalPages
            );
          }
        },

        error: error => {
          console.error(
            'Hospital API error:',
            error
          );

          this.hospitals = [
            ...HOSPITALS
          ];

          this.loading = false;

          this.loadError =
            'Backend connect nahi hua. Local hospital data dikhaya ja raha hai.';

          this.calculateDistances(
            this.hospitals
          );

          this.searchHospitals();

          this.changeDetector
            .markForCheck();
        }
      });
  }


  /* =========================================
     LOAD REMAINING HOSPITAL PAGES
  ========================================= */

  private loadRemainingPages(
    totalPages: number
  ): void {
    const remainingRequests =
      Array.from(
        {
          length:
            totalPages - 1
        },

        (_, pageIndex) =>
          this.hospitalApi.search({
            page:
              pageIndex + 1,

            size: 50
          })
      );

    if (
      remainingRequests.length === 0
    ) {
      return;
    }

    forkJoin(
      remainingRequests
    )
      .pipe(
        timeout(30000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: responses => {
          const additionalHospitals =
            responses.flatMap(
              response =>
                response.content ?? []
            );

          const hospitalMap =
            new Map<number, Hospital>();

          for (
            const hospital of [
              ...this.hospitals,
              ...additionalHospitals
            ]
          ) {
            hospitalMap.set(
              hospital.id,
              hospital
            );
          }

          this.hospitals = [
            ...hospitalMap.values()
          ];

          this.calculateDistances(
            this.hospitals
          );

          this.searchHospitals();

          this.changeDetector
            .markForCheck();
        },

        error: error => {
          console.error(
            'Remaining hospital pages error:',
            error
          );

          this.loadError =
            `${this.hospitals.length} hospitals loaded. Remaining hospital pages could not be loaded.`;

          this.changeDetector
            .markForCheck();
        }
      });
  }


  /* =========================================
     RETRY HOSPITAL LOADING
  ========================================= */

  retryLoading(): void {
    this.loadHospitals();
  }


  /* =========================================
     SEARCH HOSPITALS
  ========================================= */

  searchHospitals(): void {
    const searchLocation =
      this.location
        .trim()
        .toLowerCase();

    const searchInsurance =
      this.insurance
        .trim()
        .toLowerCase();

    this.filteredHospitals =
      this.hospitals.filter(
        hospital => {
          const locationMatch =
            searchLocation === '' ||

            hospital.city
              .toLowerCase()
              .includes(
                searchLocation
              ) ||

            hospital.state
              .toLowerCase()
              .includes(
                searchLocation
              ) ||

            hospital.name
              .toLowerCase()
              .includes(
                searchLocation
              );

          const insuranceMatch =
            searchInsurance === '' ||

            hospital.insurance.some(
              insuranceName =>
                insuranceName
                  .toLowerCase()
                  .includes(
                    searchInsurance
                  )
            );

          const hospitalDistance =
            this.hospitalDistances[
              hospital.id
            ];

          const distanceMatch =
            searchLocation !== '' ||

            this.userLatitude === null ||

            hospitalDistance ===
              undefined ||

            hospitalDistance <=
              this.distance;

          const emergencyMatch =
            !this.emergencyOnly ||
            hospital.emergency;

          const open24x7Match =
            !this.open24x7Only ||
            hospital.open24x7;

          const ratingMatch =
            !this.rating4Plus ||
            hospital.rating >= 4;

          return (
            locationMatch &&
            insuranceMatch &&
            distanceMatch &&
            emergencyMatch &&
            open24x7Match &&
            ratingMatch
          );
        }
      );

    this.sortHospitals();

    this.visibleCount = 12;
  }


  /* =========================================
     SORT HOSPITALS
  ========================================= */

  sortHospitals(): void {
    const sorted = [
      ...this.filteredHospitals
    ];

    if (
      this.sortOption ===
      'distance'
    ) {
      sorted.sort(
        (first, second) =>
          (
            this.hospitalDistances[
              first.id
            ] ?? Infinity
          ) -
          (
            this.hospitalDistances[
              second.id
            ] ?? Infinity
          )
      );

    } else if (
      this.sortOption ===
      'rating'
    ) {
      sorted.sort(
        (first, second) =>
          second.rating -
            first.rating ||

          second.reviews -
            first.reviews
      );

    } else if (
      this.sortOption ===
      'name'
    ) {
      sorted.sort(
        (first, second) =>
          first.name.localeCompare(
            second.name
          )
      );

    } else {
      sorted.sort(
        (first, second) => {
          const firstScore =
            first.rating * 100 +

            Math.min(
              first.reviews,
              2000
            ) / 100;

          const secondScore =
            second.rating * 100 +

            Math.min(
              second.reviews,
              2000
            ) / 100;

          return (
            secondScore -
            firstScore
          );
        }
      );
    }

    this.filteredHospitals =
      sorted;
  }


  /* =========================================
     LOAD MORE CARDS
  ========================================= */

  loadMore(): void {
    this.visibleCount =
      Math.min(
        this.visibleCount + 12,

        this.filteredHospitals.length
      );
  }


  /* =========================================
     HOSPITAL COMPARISON
  ========================================= */

  toggleComparison(
    hospitalId: number
  ): void {
    const result =
      this.comparisonService
        .toggleHospital(
          hospitalId
        );

    if (result === 'added') {
      this.showCompareMessage(
        'Hospital comparison mein add ho gaya.'
      );
    }

    if (result === 'removed') {
      this.showCompareMessage(
        'Hospital comparison se remove ho gaya.'
      );
    }

    if (result === 'limit') {
      this.showCompareMessage(
        'Maximum 3 hospitals compare kar sakte hain.'
      );
    }
  }


  private showCompareMessage(
    message: string
  ): void {
    this.compareMessage =
      message;

    this.changeDetector
      .markForCheck();

    if (
      this.compareMessageTimer
    ) {
      clearTimeout(
        this.compareMessageTimer
      );
    }

    this.compareMessageTimer =
      setTimeout(() => {
        this.compareMessage = '';

        this.changeDetector
          .markForCheck();
      }, 2500);
  }


  /* =========================================
     LOAD FAVORITES
  ========================================= */

  private loadFavorites(): void {
    if (
      !this.auth.currentUser()
    ) {
      this.favoriteIds.set([]);

      return;
    }

    this.favoriteApi
      .getFavorites()
      .pipe(
        timeout(15000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: favoriteHospitals => {
          const ids =
            favoriteHospitals.map(
              hospital =>
                hospital.id
            );

          this.favoriteIds.set(
            ids
          );

          this.changeDetector
            .markForCheck();
        },

        error: error => {
          console.error(
            'Favorites loading error:',
            error
          );

          this.favoriteIds.set([]);

          this.showFavoriteMessage(
            'Saved hospitals load nahi hue.'
          );

          this.changeDetector
            .markForCheck();
        }
      });
  }


  /* =========================================
     TOGGLE FAVORITE
  ========================================= */

  toggleFavorite(
    hospitalId: number
  ): void {
    if (
      !this.auth.currentUser()
    ) {
      this.showFavoriteMessage(
        'Hospital save karne ke liye sign in karein.'
      );

      return;
    }

    if (
      this.favoriteBusyIds()
        .includes(
          hospitalId
        )
    ) {
      return;
    }

    const alreadyFavorite =
      this.isFavorite(
        hospitalId
      );

    this.setFavoriteBusy(
      hospitalId,
      true
    );

    const request:
      Observable<void> =
        alreadyFavorite
          ? this.favoriteApi
              .removeFavorite(
                hospitalId
              )

          : this.favoriteApi
              .addFavorite(
                hospitalId
              );

    request
      .pipe(
        timeout(15000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: () => {
          if (alreadyFavorite) {
            this.favoriteIds.update(
              ids =>
                ids.filter(
                  id =>
                    id !== hospitalId
                )
            );

            this.showFavoriteMessage(
              'Hospital saved list se remove ho gaya.'
            );

          } else {
            this.favoriteIds.update(
              ids => [
                ...ids,
                hospitalId
              ]
            );

            this.showFavoriteMessage(
              'Hospital successfully save ho gaya.'
            );
          }

          this.setFavoriteBusy(
            hospitalId,
            false
          );

          this.changeDetector
            .markForCheck();
        },

        error: error => {
          console.error(
            'Favorite update error:',
            error
          );

          this.setFavoriteBusy(
            hospitalId,
            false
          );

          this.showFavoriteMessage(
            'Hospital save nahi hua. Please sign in again and retry.'
          );

          this.changeDetector
            .markForCheck();
        }
      });
  }


  /* =========================================
     FAVORITE STATUS
  ========================================= */

  isFavorite(
    hospitalId: number
  ): boolean {
    return this.favoriteIds()
      .includes(
        hospitalId
      );
  }


  isFavoriteBusy(
    hospitalId: number
  ): boolean {
    return this.favoriteBusyIds()
      .includes(
        hospitalId
      );
  }


  private setFavoriteBusy(
    hospitalId: number,
    busy: boolean
  ): void {
    this.favoriteBusyIds.update(
      ids => {
        if (busy) {
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


  private showFavoriteMessage(
    message: string
  ): void {
    this.favoriteMessage =
      message;

    this.changeDetector
      .markForCheck();

    if (
      this.favoriteMessageTimer
    ) {
      clearTimeout(
        this.favoriteMessageTimer
      );
    }

    this.favoriteMessageTimer =
      setTimeout(() => {
        this.favoriteMessage = '';

        this.changeDetector
          .markForCheck();
      }, 3000);
  }


  /* =========================================
     CLEAR FILTERS
  ========================================= */

  clearFilters(): void {
    this.location = '';

    this.insurance = '';

    this.distance = 20;

    this.emergencyOnly = false;

    this.open24x7Only = false;

    this.rating4Plus = false;

    this.sortOption =
      'recommended';

    this.userLatitude = null;

    this.userLongitude = null;

    this.hospitalDistances = {};

    this.locationStatus = '';

    this.searchHospitals();
  }


  /* =========================================
     GPS LOCATION
  ========================================= */

  useMyLocation(): void {
    if (
      typeof navigator ===
        'undefined' ||

      !navigator.geolocation
    ) {
      this.locationStatus =
        'Location services are not supported by this browser.';

      this.changeDetector
        .markForCheck();

      return;
    }

    this.locationStatus =
      'Detecting your location…';

    this.changeDetector
      .markForCheck();

    navigator.geolocation
      .getCurrentPosition(
        position => {
          this.userLatitude =
            position.coords.latitude;

          this.userLongitude =
            position.coords.longitude;

          this.location = '';

          this.calculateDistances(
            this.hospitals
          );

          this.searchHospitals();

          this.locationStatus =
            `Location detected. Showing hospitals within ${this.distance} km.`;

          this.changeDetector
            .markForCheck();
        },

        error => {
          if (error.code === 1) {
            this.locationStatus =
              'Location permission was denied. Allow access and try again.';

          } else if (
            error.code === 3
          ) {
            this.locationStatus =
              'Location request timed out. Please try again.';

          } else {
            this.locationStatus =
              'Your location could not be determined.';
          }

          this.changeDetector
            .markForCheck();
        },

        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 300000
        }
      );
  }


  /* =========================================
     CALCULATE DISTANCES
  ========================================= */

  private calculateDistances(
    hospitalList: Hospital[]
  ): void {
    const userLatitude =
      this.userLatitude;

    const userLongitude =
      this.userLongitude;

    if (
      userLatitude === null ||

      userLongitude === null
    ) {
      return;
    }

    this.hospitalDistances =
      Object.fromEntries(
        hospitalList.map(
          hospital => [
            hospital.id,

            Number(
              this.calculateDistance(
                userLatitude,

                userLongitude,

                hospital.latitude,

                hospital.longitude
              ).toFixed(1)
            )
          ]
        )
      );
  }


  /* =========================================
     HAVERSINE DISTANCE
  ========================================= */

  private calculateDistance(
    latitudeOne: number,

    longitudeOne: number,

    latitudeTwo: number,

    longitudeTwo: number
  ): number {
    const earthRadius =
      6371;

    const latitudeDifference =
      this.toRadians(
        latitudeTwo -
          latitudeOne
      );

    const longitudeDifference =
      this.toRadians(
        longitudeTwo -
          longitudeOne
      );

    const haversine =
      Math.sin(
        latitudeDifference / 2
      ) ** 2 +

      Math.cos(
        this.toRadians(
          latitudeOne
        )
      ) *

      Math.cos(
        this.toRadians(
          latitudeTwo
        )
      ) *

      Math.sin(
        longitudeDifference / 2
      ) ** 2;

    return (
      earthRadius *
      2 *
      Math.atan2(
        Math.sqrt(
          haversine
        ),

        Math.sqrt(
          1 - haversine
        )
      )
    );
  }


  private toRadians(
    value: number
  ): number {
    return (
      value *
      Math.PI /
      180
    );
  }
}