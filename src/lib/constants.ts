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

export type Admin = {
  id: number;
  username: string;
  password?: string;
};
