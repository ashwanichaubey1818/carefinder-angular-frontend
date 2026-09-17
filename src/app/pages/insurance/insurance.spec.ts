import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Insurance } from './insurance';

describe('Insurance', () => {
  let component: Insurance;
  let fixture: ComponentFixture<Insurance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Insurance],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Insurance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
