import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  FormsModule
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  forkJoin
} from 'rxjs';

import {
  Hospital
} from '../../data/hospitals';

import {
  HospitalApiService,
  PageResponse
} from '../../services/hospital-api.service';


type LocationState =
  | 'idle'
  | 'locating'
  | 'success'
  | 'error';

interface EmergencyHospitalResult {
  hospital: Hospital;

  distanceKm: number | null;
}


@Component({
  selector: 'app-emergency',

  standalone: true,

  imports: [
    FormsModule,
    RouterLink
  ],

  templateUrl:
    './emergency.html',

  styleUrl:
    './emergency.css'
})
export class Emergency
  implements OnInit {

  private readonly hospitalApi =
    inject(HospitalApiService);

  readonly loading =
    signal(true);

  readonly backgroundLoading =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly warningMessage =
    signal('');

  readonly locationState =
    signal<LocationState>('idle');

  readonly locationMessage =
    signal(
      'Use your location to find the nearest emergency hospitals.'
    );

  readonly emergencyHospitals =
    signal<Hospital[]>([]);

  readonly results =
    signal<
      EmergencyHospitalResult[]
    >([]);

  private readonly backendTotal =
    signal(0);

  radius = 50;

  cityQuery = '';

  visibleCount = 12;

  userLatitude:
    number | null = null;

  userLongitude:
    number | null = null;

  locationAccuracy:
    number | null = null;

  readonly radiusOptions = [
    5,
    10,
    20,
    50,
    100,
    200
  ];


  /* =========================================
     INITIAL LOAD
  ========================================= */

  ngOnInit(): void {
    this.loadEmergencyHospitals();
  }


  /* =========================================
     BACKEND DATA
  ========================================= */

  loadEmergencyHospitals(): void {
    if (this.loading()) {
      this.errorMessage.set('');
    }

    this.loading.set(true);

    this.warningMessage.set('');

    this.hospitalApi
      .search({
        emergency: true,

        sort: 'recommended',

        page: 0,

        size: 50
      })
      .subscribe({
        next: firstPage => {
          const firstHospitals =
            firstPage.content.filter(
              hospital =>
                hospital.emergency
            );

          this.backendTotal.set(
            firstPage.totalElements
          );

          this.applyHospitalList(
            firstHospitals
          );

          this.loading.set(false);

          this.loadRemainingPages(
            firstPage,
            firstHospitals
          );
        },

        error: error => {
          this.loading.set(false);

          this.emergencyHospitals.set([]);

          this.results.set([]);

          this.errorMessage.set(
            this.readErrorMessage(error)
          );
        }
      });
  }


  /* =========================================
     REMAINING BACKEND PAGES
  ========================================= */

  private loadRemainingPages(
    firstPage:
      PageResponse<Hospital>,

    firstHospitals:
      Hospital[]
  ): void {
    if (
      firstPage.totalPages <= 1
    ) {
      return;
    }

    const remainingRequests =
      Array.from(
        {
          length:
            firstPage.totalPages - 1
        },

        (_, index) =>
          this.hospitalApi.search({
            emergency: true,

            sort: 'recommended',

            page: index + 1,

            size: firstPage.size
          })
      );

    this.backgroundLoading.set(true);

    forkJoin(
      remainingRequests
    ).subscribe({
      next: pages => {
        const remainingHospitals =
          pages.flatMap(
            page =>
              page.content.filter(
                hospital =>
                  hospital.emergency
              )
          );

        this.applyHospitalList([
          ...firstHospitals,
          ...remainingHospitals
        ]);

        this.backgroundLoading.set(
          false
        );
      },

      error: () => {
        this.backgroundLoading.set(
          false
        );

        this.warningMessage.set(
          'Some emergency hospitals could not be loaded. The available results are still shown.'
        );
      }
    });
  }


  /* =========================================
     REMOVE DUPLICATES AND CREATE RESULTS
  ========================================= */

  private applyHospitalList(
    hospitals: Hospital[]
  ): void {
    const uniqueHospitals =
      Array.from(
        new Map(
          hospitals.map(
            hospital => [
              hospital.id,
              hospital
            ]
          )
        ).values()
      );

    const sortedHospitals =
      this.sortEmergencyHospitals(
        uniqueHospitals
      );

    this.emergencyHospitals.set(
      sortedHospitals
    );

    if (
      this.userLatitude !== null &&
      this.userLongitude !== null
    ) {
      this.calculateEmergencyDistances();
    } else {
      this.results.set(
        sortedHospitals.map(
          hospital => ({
            hospital,

            distanceKm: null
          })
        )
      );
    }
  }


  /* =========================================
     SORT EMERGENCY HOSPITALS
  ========================================= */

  private sortEmergencyHospitals(
    hospitals: Hospital[]
  ): Hospital[] {
    return [
      ...hospitals
    ].sort(
      (first, second) => {
        if (
          first.open24x7 !==
          second.open24x7
        ) {
          return first.open24x7
            ? -1
            : 1;
        }

        return (
          second.rating -
          first.rating
        );
      }
    );
  }


  /* =========================================
     FILTERED RESULTS
  ========================================= */

  private getFilteredResults():
    EmergencyHospitalResult[] {
    let hospitals = [
      ...this.results()
    ];

    const searchValue =
      this.cityQuery
        .trim()
        .toLowerCase();

    if (searchValue) {
      hospitals = hospitals.filter(
        result => {
          const hospital =
            result.hospital;

          return (
            hospital.name
              .toLowerCase()
              .includes(searchValue) ||

            hospital.city
              .toLowerCase()
              .includes(searchValue) ||

            hospital.state
              .toLowerCase()
              .includes(searchValue)
          );
        }
      );
    }

    if (
      this.locationState() ===
      'success'
    ) {
      hospitals = hospitals.filter(
        result =>
          result.distanceKm !== null &&
          result.distanceKm <=
            this.radius
      );
    }

    return hospitals;
  }

  get visibleHospitals():
    EmergencyHospitalResult[] {
    return this
      .getFilteredResults()
      .slice(
        0,
        this.visibleCount
      );
  }

  get matchingHospitalCount():
    number {
    return this
      .getFilteredResults()
      .length;
  }

  get hasMoreHospitals():
    boolean {
    return (
      this.visibleCount <
      this.matchingHospitalCount
    );
  }

  get totalEmergencyHospitals():
    number {
    return Math.max(
      this.backendTotal(),
      this.emergencyHospitals()
        .length
    );
  }

  get open24x7Count():
    number {
    return this
      .emergencyHospitals()
      .filter(
        hospital =>
          hospital.open24x7
      )
      .length;
  }

  get isLocating():
    boolean {
    return (
      this.locationState() ===
      'locating'
    );
  }


  /* =========================================
     SEARCH CHANGE
  ========================================= */

  onSearchChange(): void {
    this.visibleCount = 12;
  }


  /* =========================================
     LOAD MORE
  ========================================= */

  loadMore(): void {
    this.visibleCount =
      Math.min(
        this.visibleCount + 12,
        this.matchingHospitalCount
      );
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
      this.locationState.set(
        'error'
      );

      this.locationMessage.set(
        'Location service is not supported by this browser.'
      );

      return;
    }

    this.locationState.set(
      'locating'
    );

    this.locationMessage.set(
      'Detecting your current location...'
    );

    navigator.geolocation
      .getCurrentPosition(
        position => {
          this.userLatitude =
            position.coords.latitude;

          this.userLongitude =
            position.coords.longitude;

          this.locationAccuracy =
            Math.round(
              position.coords.accuracy
            );

          this.cityQuery = '';

          this.visibleCount = 12;

          this.calculateEmergencyDistances();

          this.locationState.set(
            'success'
          );

          this.locationMessage.set(
            `Location detected. Showing emergency hospitals within ${this.radius} km.`
          );
        },

        error => {
          this.locationState.set(
            'error'
          );

          if (error.code === 1) {
            this.locationMessage.set(
              'Location permission was denied. Allow location permission and try again.'
            );

          } else if (
            error.code === 2
          ) {
            this.locationMessage.set(
              'Your current location is unavailable. Search hospitals by city instead.'
            );

          } else if (
            error.code === 3
          ) {
            this.locationMessage.set(
              'Location request timed out. Please try again.'
            );

          } else {
            this.locationMessage.set(
              'Your location could not be detected.'
            );
          }
        },

        {
          enableHighAccuracy: true,

          timeout: 12000,

          maximumAge: 300000
        }
      );
  }


  /* =========================================
     UPDATE RADIUS
  ========================================= */

  updateRadius(): void {
    this.visibleCount = 12;

    if (
      this.locationState() ===
      'success'
    ) {
      this.locationMessage.set(
        `Showing emergency hospitals within ${this.radius} km.`
      );
    }
  }


  /* =========================================
     SHOW ALL
  ========================================= */

  showAllEmergencyHospitals(): void {
    this.userLatitude = null;

    this.userLongitude = null;

    this.locationAccuracy = null;

    this.radius = 50;

    this.cityQuery = '';

    this.visibleCount = 12;

    this.results.set(
      this.emergencyHospitals()
        .map(
          hospital => ({
            hospital,

            distanceKm: null
          })
        )
    );

    this.locationState.set(
      'idle'
    );

    this.locationMessage.set(
      'Showing emergency hospitals from the CareFinder backend directory.'
    );
  }


  /* =========================================
     INCREASE RADIUS
  ========================================= */

  increaseRadius(): void {
    this.radius = 200;

    this.visibleCount = 12;

    this.updateRadius();
  }


  /* =========================================
     GOOGLE MAP DIRECTIONS
  ========================================= */

  getDirectionsUrl(
    hospital: Hospital
  ): string {
    const destination =
      `${hospital.latitude},${hospital.longitude}`;

    if (
      this.userLatitude !== null &&
      this.userLongitude !== null
    ) {
      const origin =
        `${this.userLatitude},${this.userLongitude}`;

      return (
        'https://www.google.com/maps/dir/?api=1' +
        `&origin=${origin}` +
        `&destination=${destination}`
      );
    }

    return (
      'https://www.google.com/maps/dir/?api=1' +
      `&destination=${destination}`
    );
  }


  /* =========================================
     DISTANCE TEXT
  ========================================= */

  formatDistance(
    distance: number | null
  ): string {
    if (distance === null) {
      return '';
    }

    if (distance < 1) {
      return (
        `${Math.round(
          distance * 1000
        )} m away`
      );
    }

    return (
      `${distance.toFixed(1)} km away`
    );
  }


  /* =========================================
     CALCULATE ALL DISTANCES
  ========================================= */

  private calculateEmergencyDistances():
    void {
    if (
      this.userLatitude === null ||
      this.userLongitude === null
    ) {
      return;
    }

    const latitude =
      this.userLatitude;

    const longitude =
      this.userLongitude;

    const calculatedResults =
      this.emergencyHospitals()
        .map(
          hospital => ({
            hospital,

            distanceKm:
              this.calculateDistance(
                latitude,
                longitude,
                hospital.latitude,
                hospital.longitude
              )
          })
        )
        .sort(
          (first, second) =>
            (
              first.distanceKm ??
              Infinity
            ) -
            (
              second.distanceKm ??
              Infinity
            )
        );

    this.results.set(
      calculatedResults
    );
  }


  /* =========================================
     HAVERSINE DISTANCE
  ========================================= */

  private calculateDistance(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number
  ): number {
    const earthRadius = 6371;

    const latitudeDifference =
      this.toRadians(
        latitude2 - latitude1
      );

    const longitudeDifference =
      this.toRadians(
        longitude2 - longitude1
      );

    const calculation =
      Math.sin(
        latitudeDifference / 2
      ) ** 2 +

      Math.cos(
        this.toRadians(
          latitude1
        )
      ) *

      Math.cos(
        this.toRadians(
          latitude2
        )
      ) *

      Math.sin(
        longitudeDifference / 2
      ) ** 2;

    return (
      earthRadius *
      2 *
      Math.atan2(
        Math.sqrt(calculation),

        Math.sqrt(
          1 - calculation
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


  /* =========================================
     ERROR MESSAGE
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
    }

    return 'Emergency hospitals could not be loaded.';
  }
}