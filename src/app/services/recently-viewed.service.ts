import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  Hospital
} from '../data/hospitals';

import {
  environment
} from '../../environments/environment';

export interface RecentlyViewedRecord {
  hospital: Hospital;

  lastViewedAt: string;

  viewCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecentlyViewedService {
  private readonly http =
    inject(HttpClient);

  private readonly recentlyViewedUrl =
    `${environment.apiUrl}/me/recently-viewed`;

  readonly records =
    signal<RecentlyViewedRecord[]>([]);

  readonly hospitals =
    computed(() =>
      this.records().map(
        record => record.hospital
      )
    );

  readonly loading =
    signal(false);

  readonly removingIds =
    signal<number[]>([]);

  readonly clearing =
    signal(false);

  readonly errorMessage =
    signal('');

  constructor() {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.http
      .get<RecentlyViewedRecord[]>(
        this.recentlyViewedUrl
      )
      .subscribe({
        next: records => {
          this.records.set(records);

          this.loading.set(false);
        },

        error: error => {
          this.records.set([]);

          this.loading.set(false);

          this.errorMessage.set(
            this.readErrorMessage(error)
          );
        }
      });
  }

  addHospital(
    hospitalId: number
  ): void {
    this.http
      .post<void>(
        `${this.recentlyViewedUrl}/${hospitalId}`,
        {}
      )
      .subscribe({
        next: () => {
          this.loadHistory();
        },

        error: error => {
          this.errorMessage.set(
            this.readErrorMessage(error)
          );
        }
      });
  }

  removeHospital(
    hospitalId: number
  ): void {
    if (
      this.removingIds().includes(
        hospitalId
      )
    ) {
      return;
    }

    this.removingIds.update(
      ids => [
        ...ids,
        hospitalId
      ]
    );

    this.errorMessage.set('');

    this.http
      .delete<void>(
        `${this.recentlyViewedUrl}/${hospitalId}`
      )
      .subscribe({
        next: () => {
          this.records.update(
            records =>
              records.filter(
                record =>
                  record.hospital.id !==
                  hospitalId
              )
          );

          this.finishRemoving(
            hospitalId
          );
        },

        error: error => {
          this.finishRemoving(
            hospitalId
          );

          this.errorMessage.set(
            this.readErrorMessage(error)
          );
        }
      });
  }

  clearHistory(): void {
    if (this.clearing()) {
      return;
    }

    this.clearing.set(true);

    this.errorMessage.set('');

    this.http
      .delete<void>(
        this.recentlyViewedUrl
      )
      .subscribe({
        next: () => {
          this.records.set([]);

          this.clearing.set(false);
        },

        error: error => {
          this.clearing.set(false);

          this.errorMessage.set(
            this.readErrorMessage(error)
          );
        }
      });
  }

  isRemoving(
    hospitalId: number
  ): boolean {
    return this.removingIds()
      .includes(hospitalId);
  }

  getRecord(
    hospitalId: number
  ): RecentlyViewedRecord | undefined {
    return this.records().find(
      record =>
        record.hospital.id ===
        hospitalId
    );
  }

  private finishRemoving(
    hospitalId: number
  ): void {
    this.removingIds.update(
      ids =>
        ids.filter(
          id => id !== hospitalId
        )
    );
  }

  private readErrorMessage(
    error: unknown
  ): string {
    if (
      error instanceof HttpErrorResponse
    ) {
      if (error.status === 0) {
        return 'Backend is unavailable. Make sure Spring Boot is running on port 8080.';
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

    return 'Recently viewed hospitals could not be loaded.';
  }
}