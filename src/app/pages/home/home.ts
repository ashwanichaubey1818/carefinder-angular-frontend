import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { HOSPITALS, INSURANCE_PROVIDERS } from '../../data/hospitals';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  readonly auth = inject(AuthService);
  readonly hospitals = HOSPITALS;
  readonly insuranceProviders = INSURANCE_PROVIDERS;
  readonly featuredHospitals = [...HOSPITALS]
    .sort((first, second) => second.rating - first.rating)
    .slice(0, 3);
  readonly cityCoverage = [
    { name: 'New Delhi', count: 5, width: 96 },
    { name: 'Mumbai', count: 5, width: 96 },
    { name: 'Bengaluru', count: 5, width: 96 },
    { name: 'Bhubaneswar', count: 4, width: 78 }
  ];
  readonly quickCities = ['New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Bhubaneswar'];
  readonly stateCount = new Set(HOSPITALS.map(hospital => hospital.state)).size;
  readonly emergencyCount = HOSPITALS.filter(hospital => hospital.emergency).length;

  location = '';
  insurance = '';
}
