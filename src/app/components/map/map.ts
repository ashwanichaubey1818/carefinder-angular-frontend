import {
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  afterNextRender,
  input,
  viewChild
} from '@angular/core';

import type {
  Map as LeafletMap,
  Marker
} from 'leaflet';


@Component({
  selector:
    'app-map',

  host: {
    ngSkipHydration:
      'true'
  },

  templateUrl:
    './map.html',

  styleUrl:
    './map.css'
})
export class Map
  implements OnChanges, OnDestroy {

  readonly latitude =
    input.required<number>();

  readonly longitude =
    input.required<number>();


  private readonly mapContainer =
    viewChild.required<
      ElementRef<HTMLElement>
    >(
      'mapContainer'
    );


  private map?:
    LeafletMap;

  private marker?:
    Marker;

  private resizeObserver?:
    ResizeObserver;

  private initializationFrameId?:
    number;

  private destroyed =
    false;


  constructor() {
    afterNextRender({
      write: () => {
        this.initializationFrameId =
          requestAnimationFrame(
            () => {
              void this.createMap();
            }
          );
      }
    });
  }


  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      !this.map ||
      (
        !changes['latitude'] &&
        !changes['longitude']
      )
    ) {
      return;
    }

    this.updateMap();
  }


  ngOnDestroy(): void {
    this.destroyed =
      true;


    if (
      this.initializationFrameId !==
      undefined
    ) {
      cancelAnimationFrame(
        this.initializationFrameId
      );
    }


    this.resizeObserver
      ?.disconnect();


    this.map
      ?.remove();


    this.marker =
      undefined;

    this.map =
      undefined;
  }


  private async createMap():
    Promise<void> {

    if (
      this.destroyed ||
      this.map
    ) {
      return;
    }


    const container =
      this.mapContainer()
        .nativeElement;


    /*
     * Leaflet CommonJS/ESM production export fix.
     */
    const leafletModule =
      await import(
        'leaflet'
      );


    type LeafletNamespace =
      typeof import('leaflet');


    const leafletCandidate =
      leafletModule as unknown as
        LeafletNamespace & {
          default?:
            LeafletNamespace;
        };


    const leaflet =
      typeof leafletCandidate.map ===
        'function'

        ? leafletCandidate

        : leafletCandidate.default;


    if (
      !leaflet ||
      typeof leaflet.map !==
        'function'
    ) {
      throw new Error(
        'Leaflet module could not be loaded.'
      );
    }


    if (
      this.destroyed ||
      this.map ||
      !container.isConnected
    ) {
      return;
    }


    const location:
      [number, number] = [

      this.latitude(),

      this.longitude()
    ];


    this.map =
      leaflet
        .map(
          container
        )
        .setView(
          location,
          13
        );


    leaflet
      .tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

        {
          maxZoom:
            19,

          attribution:
            '&copy; OpenStreetMap contributors'
        }
      )
      .addTo(
        this.map
      );


    this.marker =
      leaflet
        .marker(
          location
        )
        .addTo(
          this.map
        );


    this.marker
      .bindPopup(
        'Hospital location'
      )
      .openPopup();


    requestAnimationFrame(
      () => {
        this.map
          ?.invalidateSize(
            false
          );
      }
    );


    this.resizeObserver =
      new ResizeObserver(
        () => {
          this.map
            ?.invalidateSize(
              false
            );
        }
      );


    this.resizeObserver.observe(
      container
    );
  }


  private updateMap(): void {
    if (
      !this.map
    ) {
      return;
    }


    const location:
      [number, number] = [

      this.latitude(),

      this.longitude()
    ];


    this.map.setView(
      location,
      13
    );


    this.marker
      ?.setLatLng(
        location
      );


    requestAnimationFrame(
      () => {
        this.map
          ?.invalidateSize(
            false
          );
      }
    );
  }
}