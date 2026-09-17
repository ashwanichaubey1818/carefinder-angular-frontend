import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HospitalCompare } from "./hospital-compare";

describe("HospitalCompare", () => {
  let component: HospitalCompare;
  let fixture: ComponentFixture<HospitalCompare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalCompare],
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalCompare);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
