import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Map } from './map';

describe('Map', () => {
  let fixture: ComponentFixture<Map>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Map],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
    }).compileComponents();

    fixture = TestBed.createComponent(Map);
    fixture.componentRef.setInput('latitude', 20.2961);
    fixture.componentRef.setInput('longitude', 85.8245);
    await fixture.whenStable();
  });

  it('should create an SSR-safe map container', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
