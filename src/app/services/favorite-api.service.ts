import {
  HttpClient
} from '@angular/common/http';

import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable,
  map
} from 'rxjs';

import {
  Hospital
} from '../data/hospitals';

import {
  environment
} from '../../environments/environment';


/* =========================================
   BACKEND FAVORITE RESPONSE
========================================= */

export interface FavoriteRecord {
  hospital: Hospital;

  savedAt: string;
}


@Injectable({
  providedIn: 'root'
})
export class FavoriteApiService {
  private readonly http =
    inject(HttpClient);

  private readonly favoritesUrl =
    `${environment.apiUrl}/me/favorites`;


  /* =========================================
     GET SAVED HOSPITALS
  ========================================= */

  getFavorites():
    Observable<Hospital[]> {
    return this.http
      .get<FavoriteRecord[]>(
        this.favoritesUrl
      )
      .pipe(
        map(records =>
          records.map(
            record =>
              record.hospital
          )
        )
      );
  }


  /* =========================================
     ADD HOSPITAL TO FAVORITES
  ========================================= */

  addFavorite(
    hospitalId: number
  ): Observable<void> {
    return this.http.post<void>(
      `${this.favoritesUrl}/${hospitalId}`,
      {}
    );
  }


  /* =========================================
     REMOVE HOSPITAL FROM FAVORITES
  ========================================= */

  removeFavorite(
    hospitalId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.favoritesUrl}/${hospitalId}`
    );
  }
}