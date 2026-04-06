import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PontoPage } from './ponto.page';

describe('PontoPage', () => {
  let component: PontoPage;
  let fixture: ComponentFixture<PontoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PontoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
