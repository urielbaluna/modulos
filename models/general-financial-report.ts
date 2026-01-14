export interface Reporte {
  fiIdPeriodo: number;
  fiIdAsignacion: number;
  fiIdEmpresa: number;
  fcEmpresa: string;
  fiIdEmpleado: string;
  fcEmpleado: string;
  fiIdStatus: number;
  fcStatus: string;
  fdFechaInicial: string;
  fdFechaFinal: string;
  fdFechaRegistro: string;
  fiAnio: number;
  fiMes: number;
  fcMes: string;
  mes: string;
  fcOdc: string;
  fdFechaOdc: string;
  fcCfdi: string;
  fdFechaCfdi: string;
  fdFechaPago: string;
  fcComentarios: string;
  fiMontoPago: number;
  fiOrden: number;
  fdFechaBitacora: string;
  fcRiesgo: string;
  fiTarifa: number;
  fcSelectividad: string;
  documentoBase64?: string;
  nombre?: string;
}

export interface Columna {
  label: string;
  field: keyof Reporte;
  visible: boolean;
}