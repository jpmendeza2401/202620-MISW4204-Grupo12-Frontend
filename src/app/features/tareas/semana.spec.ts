import { aISO, desdeISO, etiquetaSemana, lunesDe, sumarDias } from './semana';

describe('utilidades de semana', () => {
  it('formatea una fecha local como YYYY-MM-DD', () => {
    expect(aISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('lee YYYY-MM-DD como fecha local', () => {
    const f = desdeISO('2026-11-01');
    expect([f.getFullYear(), f.getMonth(), f.getDate()]).toEqual([2026, 10, 1]);
  });

  it('el lunes de un domingo es el lunes anterior (semana lunes–domingo)', () => {
    expect(aISO(lunesDe(new Date(2026, 10, 1)))).toBe('2026-10-26'); // domingo 1 nov
  });

  it('el lunes de un lunes es el mismo día', () => {
    expect(aISO(lunesDe(new Date(2026, 10, 2)))).toBe('2026-11-02');
  });

  it('suma y resta semanas cruzando meses', () => {
    expect(sumarDias('2026-10-26', 7)).toBe('2026-11-02');
    expect(sumarDias('2026-11-02', -7)).toBe('2026-10-26');
  });

  it('arma la etiqueta de lunes a domingo', () => {
    expect(etiquetaSemana('2026-10-26')).toContain('2026');
  });
});
