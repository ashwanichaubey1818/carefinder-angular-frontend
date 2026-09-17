import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Hospitals } from './hospitals';

describe('Hospitals', () => {
  let component: Hospitals;
  let fixture: ComponentFixture<Hospitals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hospitals],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Hospitals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
