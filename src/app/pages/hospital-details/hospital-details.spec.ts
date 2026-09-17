import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { HospitalDetails } from './hospital-details';

describe('HospitalDetails', () => {
  let component: HospitalDetails;
  let fixture: ComponentFixture<HospitalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalDetails],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create a hospital profile', () => {
    expect(component).toBeTruthy();
    expect(component.hospital?.id).toBe(1);
  });
});
