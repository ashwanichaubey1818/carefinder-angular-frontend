import {
  Component,
  computed,
  inject
} from '@angular/core';

import { RouterLink } from '@angular/router';

import {
  HospitalComparisonService
} from '../../services/hospital-comparison.service';

@Component({
  selector: 'app-hospital-compare',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl: './hospital-compare.html',

  styleUrl: './hospital-compare.css'
})
export class HospitalCompare {
  readonly comparison =
    inject(HospitalComparisonService);


  /* Selected hospitals */

  readonly hospitals =
    this.comparison.selectedHospitals;


  /* Highest rating */

  readonly bestRating = computed(() => {
    const selectedHospitals =
      this.hospitals();

    if (
      selectedHospitals.length === 0
    ) {
      return 0;
    }

    return Math.max(
      ...selectedHospitals.map(
        hospital => hospital.rating
      )
    );
  });


  /* Maximum beds */

  readonly maximumBeds = computed(() => {
    const selectedHospitals =
      this.hospitals();

    if (
      selectedHospitals.length === 0
    ) {
      return 0;
    }

    return Math.max(
      ...selectedHospitals.map(
        hospital => hospital.beds
      )
    );
  });


  /* Common insurance providers */

  readonly commonInsurance = computed(() => {
    const selectedHospitals =
      this.hospitals();

    if (
      selectedHospitals.length < 2
    ) {
      return [];
    }

    const firstHospitalInsurance =
      selectedHospitals[0].insurance;

    return firstHospitalInsurance.filter(
      insurance =>
        selectedHospitals.every(
          hospital =>
            hospital.insurance.includes(
              insurance
            )
        )
    );
  });


  /* Remove single hospital */

  removeHospital(
    hospitalId: number
  ): void {
    this.comparison.removeHospital(
      hospitalId
    );
  }


  /* Clear complete comparison */

  clearAll(): void {
    this.comparison.clearComparison();
  }
}