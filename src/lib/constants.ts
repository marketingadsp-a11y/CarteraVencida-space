export type Payment = {
  id: string; // Added for unique identification
  fecha: string;
  monto: number;
  saldoAnterior: number;
  saldoNuevo: number;
  clienteId?: string; // For global history
  clienteNombre?: string; // For global history
  plaza?: string; // For global history
};

export type Client = {
  id: string;
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
  id: string;
  username: string;
  password?: string;
};

export type UserPermissions = {
  canRegister: boolean;
  canImport: boolean;
  canExport: boolean;
  canExportHistory: boolean;
};

export type UserPlazaAccess = {
  plazaName: string;
  permissions: UserPermissions;
};

export type User = {
  id: string;
  username: string;
  password?: string;
  plazas: UserPlazaAccess[];
};

export type ActionLog = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'IMPORT' | 'LOGIN';
  details?: Record<string, any>;
};
