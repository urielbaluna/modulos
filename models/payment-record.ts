export interface CFDIs {
  fcCfdi: string;
  fcOdc: string;
  fiIdAsignacion: number;
  fiIdPeriodo: number;
  fiAnio: number;
  fiMes: number;
  fcMes: string;
  fiIdEmpleado: string;
  fcEmpleado: string;
  fiIdEmpresa: number;
  fcEmpresa: string;
  fiTarifa: number;
}

export interface Columna {
  label: string;
  field: keyof CFDIs;
  visible: boolean;
}