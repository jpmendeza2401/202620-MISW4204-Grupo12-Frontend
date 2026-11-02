/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ReportsIAComponent } from './reportsIA.component';

describe('ReportsIAComponent', () => {
  let component: ReportsIAComponent;
  let fixture: ComponentFixture<ReportsIAComponent>;

  beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ReportsIAComponent]
      }).compileComponents();
    });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsIAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
