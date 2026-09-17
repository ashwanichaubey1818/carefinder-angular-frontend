import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';

import {
  HOSPITALS,
  Hospital
} from '../data/hospitals';

export type CompareResult =
  | 'added'
  | 'removed'
  | 'limit';

@Injectable({
  providedIn: 'root'
})
export class HospitalComparisonService {
  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly storageKey =
    'carefinder-compare-hospitals';

  private readonly selectedIdsSignal =
    signal<number[]>([]);

  readonly selectedIds =
    this.selectedIdsSignal.asReadonly();

  readonly count = computed(() => {
    return this.selectedIdsSignal().length;
  });

  readonly selectedHospitals = computed<Hospital[]>(
    () => {
      return this.selectedIdsSignal()
        .map(id =>
          HOSPITALS.find(
            hospital => hospital.id === id
          )
        )
        .filter(
          (hospital): hospital is Hospital =>
            hospital !== undefined
        );
    }
  );

  constructor() {
    this.restoreSelection();
  }

  toggleHospital(
    hospitalId: number
  ): CompareResult {
    const currentIds =
      this.selectedIdsSignal();

    if (currentIds.includes(hospitalId)) {
      const updatedIds = currentIds.filter(
        id => id !== hospitalId
      );

      this.selectedIdsSignal.set(updatedIds);
      this.saveSelection(updatedIds);

      return 'removed';
    }

    if (currentIds.length >= 3) {
      return 'limit';
    }

    const updatedIds = [
      ...currentIds,
      hospitalId
    ];

    this.selectedIdsSignal.set(updatedIds);
    this.saveSelection(updatedIds);

    return 'added';
  }

  removeHospital(hospitalId: number): void {
    const updatedIds =
      this.selectedIdsSignal().filter(
        id => id !== hospitalId
      );

    this.selectedIdsSignal.set(updatedIds);
    this.saveSelection(updatedIds);
  }

  isSelected(hospitalId: number): boolean {
    return this.selectedIdsSignal().includes(
      hospitalId
    );
  }

  clearComparison(): void {
    this.selectedIdsSignal.set([]);
    this.saveSelection([]);
  }

  private saveSelection(ids: number[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(ids)
    );
  }

  private restoreSelection(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const savedValue =
        localStorage.getItem(this.storageKey);

      if (!savedValue) {
        return;
      }

      const savedIds =
        JSON.parse(savedValue) as unknown;

      if (!Array.isArray(savedIds)) {
        return;
      }

      const validIds = savedIds
        .filter(
          (id): id is number =>
            typeof id === 'number' &&
            HOSPITALS.some(
              hospital => hospital.id === id
            )
        )
        .slice(0, 3);

      this.selectedIdsSignal.set(validIds);
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }
}