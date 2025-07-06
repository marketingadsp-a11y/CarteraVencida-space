export type Payment = {
  fecha: string;
  monto: number;
  saldoAnterior: number;
  saldoNuevo: number;
};

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
  historialPagos?: Payment[];
};

export type Admin = {
  id: number;
  username: string;
  password?: string;
};

export type UserPermissions = {
  canRegister: boolean;
  canImport: boolean;
  canExport: boolean;
};

export type UserPlazaAccess = {
  plazaName: string;
  permissions: UserPermissions;
};

export type User = {
  id: number;
  username: string;
  password?: string;
  plazas: UserPlazaAccess[];
};
