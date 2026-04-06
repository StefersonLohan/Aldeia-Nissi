import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortariaPage } from './portaria.page';

describe('PortariaPage', () => {
  let component: PortariaPage;
  let fixture: ComponentFixture<PortariaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PortariaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
