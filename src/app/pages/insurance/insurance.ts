import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HOSPITALS, INSURANCE_PROVIDERS } from '../../data/hospitals';

@Component({
  selector: 'app-insurance',
  imports: [RouterLink],
  templateUrl: './insurance.html',
  styleUrl: './insurance.css'
})
export class Insurance {
  readonly providers = INSURANCE_PROVIDERS.map(provider => ({
    name: provider,
    hospitalCount: HOSPITALS.filter(hospital => hospital.insurance.includes(provider)).length
  }));
}
