export interface ExpenseReport {
    periodo: number;
    fcEmpresa: string;
    empleados: number;
    gasto: number;
    ingreso: number;
}

export interface Columna {
    label: string;
    field: keyof ExpenseReport;
    visible: boolean;
}