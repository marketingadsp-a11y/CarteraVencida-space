export type Client = {
  id: number;
  plaza: string;
  fecha: string;
  nombre: string;
  direccion: string;
  telefono: string;
  aval: string;
  telefonoAval: string;
  prestamo: number;
  pago: number;
  vencidos: number;
  adeudo: number;
  recuperado?: boolean;
};

export const PLAZAS = [
  "AUTLAN PREPA",
  "CREDIMEX",
  "UNION DE TULA",
  "TECOLOTLAN",
  "OFICINA CENTRO",
  "RUTA AARON",
] as const;

export type Plaza = typeof PLAZAS[number];
