export interface Employee {
  fiIdEmpleado: string;
  fiIdProspecto: number;
  fcNombre: string;
  fcPaterno: string;
  fcMaterno: string;
  fdFechaNac: string;
  fcNss: number;
  fcCurp: string;
  fcNumero: number;
  fcMail: string;
  fdFechaAlta: string;
  fcEstadoCivil: string;
  fcTecnologia: string;
  fiIdStatus: number;
  fiSalario: number;
  fcCuenta: string;
  fiNumeroCuenta: number;
  fiIdBanco: number;
  fiIdEstadoCivil: number;
  fiIdTecnologia: number;
}

export interface EmployeeAddress {
  fiIdDoEmpleado: number;
  fiIdEmpleado: string;
  fcCalle?: string | null;
  fcNumInt?: string | null;
  fcNumExt?: string | null;
  fiIdEstado: number | null;
  fcEstado?: string | null;
  fiIdMunicipio?: number | null;
  fcMunicipio?: string | null;
  fiIdColonia?: number | null;
  fcColonia?: string | null;
  fiCp?: string | null;
  fiIdPais?: number | null;
}

export interface Columna{
  label: string;
  field: keyof Employee;
  visible: boolean;
}

export interface UploadedFile {
  file: File;
  id: number; 
}

export interface CivilStatus {
  fiIdEstadoCivil: number;
  fcEstadoCivil: string;
}

export interface AvailableTechnologies {
  fiIdTecnologia: number;
  fcTecnologia: string;
}

export interface Banks {
  fiIdBanco: number;
  fcNombre: string;
}

export interface TypeOfReferences {
  fiIdReferencia: number;
  descripcion: string;
}

export interface Countries {
  fiIdPais: number;
  fcPais: string;
}

export interface States {
  fiIdEstado: number;
  fcEstado: string;
}

export interface Municipalities {
  fiIdMunicipio: number;
  fcMunicipio: string;
}

export interface Colonies {
  fiIdColonia: number;
  fcColonia: string;
  fiCodigoPostal: string;
}

export interface Reference {
  fiIdReferencia?: number | null;
  fiIdTipoReferencia?: number | null;
  fiTelefono?: string | null;
  fcIdEmpleado?: string | null;
  fcNombre?: string | null;
}