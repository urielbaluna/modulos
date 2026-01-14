export interface Periodos {
    fiAnio: number;
    fiMes: number;
    fcMes: string;
    fcIdEmpleado: string;
    fcEmpleado: string;
    fiIdEmpresa: number;
    fcEmpresa: string;
    fdTarifa: number;
    fiIdAsignacion: number;
    fiIdPeriodoFact: number;
}

export interface Columna {
    label: string;
    field: keyof Periodos;
    visible: boolean;
}