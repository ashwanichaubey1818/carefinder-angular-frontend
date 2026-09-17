import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  timeout
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  Hospital
} from '../../data/hospitals';

import {
  Map
} from '../../components/map/map';

import {
  HospitalApiService
} from '../../services/hospital-api.service';

import {
  RecentlyViewedService
} from '../../services/recently-viewed.service';

@Component({
  selector: 'app-hospital-details',

  standalone: true,

  imports: [
    RouterLink,
    Map
  ],

  templateUrl:
    './hospital-details.html',

  styleUrl:
    './hospital-details.css'
})
export class HospitalDetails {
  private readonly route =
    inject(ActivatedRoute);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly changeDetector =
    inject(ChangeDetectorRef);

  private readonly hospitalApi =
    inject(HospitalApiService);

  private readonly recentlyViewed =
    inject(RecentlyViewedService);

  private currentHospitalId:
    number | null = null;

  hospital: Hospital | null = null;

  loading = true;

  loadError = '';


  /* =========================================
     CONSTRUCTOR
  ========================================= */

  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(parameters => {
        const idValue =
          parameters.get('id');

        const hospitalId =
          Number(idValue);

        if (
          idValue === null ||

          !Number.isInteger(
            hospitalId
          ) ||

          hospitalId <= 0
        ) {
          this.loading = false;

          this.hospital = null;

          this.loadError =
            'Invalid hospital ID.';

          this.changeDetector
            .markForCheck();

          return;
        }

        this.currentHospitalId =
          hospitalId;

        this.loadHospital(
          hospitalId
        );
      });
  }


  /* =========================================
     LOAD HOSPITAL
  ========================================= */

  private loadHospital(
    hospitalId: number
  ): void {
    this.loading = true;

    this.hospital = null;

    this.loadError = '';

    this.changeDetector
      .markForCheck();

    this.hospitalApi
      .getHospital(
        hospitalId
      )
      .pipe(
        timeout(15000),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: hospital => {
          this.hospital =
            hospital;

          this.loading = false;

          this.loadError = '';

          this.recentlyViewed
            .addHospital(
              hospital.id
            );

          this.changeDetector
            .markForCheck();
        },

        error: error => {
          console.error(
            'Hospital details API error:',
            error
          );

          this.hospital = null;

          this.loading = false;

          this.loadError =
            this.getErrorMessage(
              error
            );

          this.changeDetector
            .markForCheck();
        }
      });
  }


  /* =========================================
     RETRY LOADING
  ========================================= */

  retryLoading(): void {
    if (
      this.currentHospitalId ===
      null
    ) {
      return;
    }

    this.loadHospital(
      this.currentHospitalId
    );
  }


  /* =========================================
     DOWNLOAD PDF
  ========================================= */

  downloadProfilePdf(): void {
    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }

    /*
     * Browser print dialog open hoga.
     * Destination mein Save as PDF select karein.
     */

    window.print();
  }


  /* =========================================
     ERROR MESSAGE
  ========================================= */

  private getErrorMessage(
    error: unknown
  ): string {
    if (
      error instanceof
      HttpErrorResponse
    ) {
      if (error.status === 0) {
        return 'Backend is unavailable. Make sure Spring Boot is running on port 8080.';
      }

      if (error.status === 404) {
        return 'This hospital was not found in the backend database.';
      }

      if (error.status === 401) {
        return 'Your session has expired. Please sign in again.';
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

    return 'Hospital information could not be loaded. Please try again.';
  }
}