import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RecentlyViewed } from "./recently-viewed";

describe("RecentlyViewed", () => {
  let component: RecentlyViewed;
  let fixture: ComponentFixture<RecentlyViewed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentlyViewed],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentlyViewed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
