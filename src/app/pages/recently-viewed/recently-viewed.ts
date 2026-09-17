import {
  CommonModule
} from '@angular/common';

import {
  Component,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  RecentlyViewedService
} from '../../services/recently-viewed.service';

@Component({
  selector: 'app-recently-viewed',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl:
    './recently-viewed.html',

  styleUrl:
    './recently-viewed.css'
})
export class RecentlyViewed {
  readonly recentlyViewed =
    inject(RecentlyViewedService);

  readonly records =
    this.recentlyViewed.records;

  readonly hospitals =
    this.recentlyViewed.hospitals;

  readonly loading =
    this.recentlyViewed.loading;

  readonly clearing =
    this.recentlyViewed.clearing;

  readonly errorMessage =
    this.recentlyViewed.errorMessage;

  reloadHistory(): void {
    this.recentlyViewed
      .loadHistory();
  }

  removeHospital(
    hospitalId: number
  ): void {
    this.recentlyViewed
      .removeHospital(
        hospitalId
      );
  }

  clearHistory(): void {
    const confirmed =
      window.confirm(
        'Do you want to clear your complete recently viewed history?'
      );

    if (!confirmed) {
      return;
    }

    this.recentlyViewed
      .clearHistory();
  }

  isRemoving(
    hospitalId: number
  ): boolean {
    return this.recentlyViewed
      .isRemoving(
        hospitalId
      );
  }
}