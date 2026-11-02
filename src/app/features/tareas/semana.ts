/**
 * Utilidades de semana (lunes a domingo, RN-26 / RN-29).
 * Se trabaja con la fecha local del navegador y se formatea como YYYY-MM-DD,
 * que es el formato que espera la API.
 */

/** Convierte una fecha a texto YYYY-MM-DD sin pasar por UTC (evita corrimientos de día). */
export function aISO(fecha: Date): string {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Lee un texto YYYY-MM-DD como fecha local (a medianoche). */
export function desdeISO(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Lunes de la semana que contiene la fecha dada. */
export function lunesDe(fecha: Date): Date {
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const diaSemana = (lunes.getDay() + 6) % 7; // lunes = 0 … domingo = 6
  lunes.setDate(lunes.getDate() - diaSemana);
  return lunes;
}

/** Suma (o resta) días a un lunes en formato YYYY-MM-DD. */
export function sumarDias(iso: string, dias: number): string {
  const fecha = desdeISO(iso);
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

/** Texto corto de la semana, p. ej. "26 oct – 1 nov 2026". */
export function etiquetaSemana(lunesISO: string): string {
  const inicio = desdeISO(lunesISO);
  const fin = desdeISO(sumarDias(lunesISO, 6));
  const dia = (f: Date) =>
    f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');
  return `${dia(inicio)} – ${dia(fin)} ${fin.getFullYear()}`;
}
