export interface Cartas{
    fcOdc: string;
    fiAnio: string;
    fiIdAsignacion: number;
    fiIdPeriodo: number;
    fiMes: string;
    fcMes: string;
    fiIdEmpleado: string;
    fcEmpleado: string;
    fiIdEmpresa: number;
    fcEmpresa: string;
    fiTarifa: number;
}

export interface Columna {
    label: string;
    field: keyof Cartas;
    visible: boolean;
}