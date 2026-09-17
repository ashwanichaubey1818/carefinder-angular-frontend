import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  Hospital
} from '../data/hospitals';

import {
  environment
} from '../../environments/environment';

export interface PageResponse<T> {
  content: T[];

  page: number;

  size: number;

  totalElements: number;

  totalPages: number;

  first: boolean;

  last: boolean;
}

export interface HospitalSearchFilters {
  query?: string;

  location?: string;

  insurance?: string;

  emergency?: boolean;

  open24x7?: boolean;

  minimumRating?: number;

  latitude?: number;

  longitude?: number;

  radiusKm?: number;

  sort?:
    | 'recommended'
    | 'distance'
    | 'rating'
    | 'name';

  page?: number;

  size?: number;
}

export interface HospitalComparison {
  hospitals: Hospital[];

  highlights: {
    highestRatedHospitalId:
      number | null;

    largestHospitalId:
      number | null;

    emergencyHospitalIds:
      number[];

    open24x7HospitalIds:
      number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class HospitalApiService {
  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/hospitals`;

  search(
    filters: HospitalSearchFilters
  ): Observable<PageResponse<Hospital>> {
    let params =
      new HttpParams();

    params = params.set(
      'sort',
      filters.sort ?? 'recommended'
    );

    params = params.set(
      'page',
      String(filters.page ?? 0)
    );

    params = params.set(
      'size',
      String(filters.size ?? 12)
    );

    params = this.addParameter(
      params,
      'query',
      filters.query
    );

    params = this.addParameter(
      params,
      'location',
      filters.location
    );

    params = this.addParameter(
      params,
      'insurance',
      filters.insurance
    );

    params = this.addParameter(
      params,
      'emergency',
      filters.emergency
    );

    params = this.addParameter(
      params,
      'open24x7',
      filters.open24x7
    );

    params = this.addParameter(
      params,
      'minimumRating',
      filters.minimumRating
    );

    params = this.addParameter(
      params,
      'latitude',
      filters.latitude
    );

    params = this.addParameter(
      params,
      'longitude',
      filters.longitude
    );

    params = this.addParameter(
      params,
      'radiusKm',
      filters.radiusKm
    );

    return this.http.get<
      PageResponse<Hospital>
    >(
      this.apiUrl,
      {
        params
      }
    );
  }

  getHospital(
    hospitalId: number
  ): Observable<Hospital> {
    return this.http.get<Hospital>(
      `${this.apiUrl}/${hospitalId}`
    );
  }

  compareHospitals(
    hospitalIds: number[]
  ): Observable<HospitalComparison> {
    const params =
      this.createIdsParameters(
        hospitalIds
      );

    return this.http.get<
      HospitalComparison
    >(
      `${this.apiUrl}/compare`,
      {
        params
      }
    );
  }

  downloadComparisonReport(
    hospitalIds: number[]
  ): Observable<Blob> {
    const params =
      this.createIdsParameters(
        hospitalIds
      );

    return this.http.get(
      `${this.apiUrl}/compare/report.pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  private addParameter(
    params: HttpParams,
    name: string,
    value:
      | string
      | number
      | boolean
      | null
      | undefined
  ): HttpParams {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return params;
    }

    return params.set(
      name,
      String(value)
    );
  }

  private createIdsParameters(
    hospitalIds: number[]
  ): HttpParams {
    let params =
      new HttpParams();

    for (
      const hospitalId of hospitalIds
    ) {
      params = params.append(
        'ids',
        String(hospitalId)
      );
    }

    return params;
  }
}