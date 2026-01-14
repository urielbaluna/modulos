import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { ExpenseReport, Columna } from '../../../core/models/expense-report';
import { ExpenseReportService } from '../../../core/services/expense-report.service';

@Component({
  selector: 'app-expense-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expense-report.component.html',
  styleUrl: './expense-report.component.css'
})

export class ExpenseReportComponent implements OnInit {
  showChart = false;
  expenseReport: any[] = [];
  sortDirection: 'asc' | 'desc' = 'asc';
  sortColumn: string | null = null;
  title: string = 'Reporte Gastos';
  iconExit: boolean = false;
  isDrilled = false;
  drilledEmpresaId: number | null = null;
  drilledCompanyName: string | null = null;
  isShowingCompanies = false;

  paddingTop = 8;
  paddingBottom = 20;
  paddingLeft = 40;
  paddingRight = 24;
  chartHeight = 150;

  columnas: Columna[] = [
    { label: 'PERIODO', field: 'periodo', visible: true },
    { label: 'EMPRESAS', field: 'fcEmpresa', visible: true },
    { label: 'EMPLEADOS', field: 'empleados', visible: true },
    { label: 'GASTO', field: 'gasto', visible: true },
    { label: 'INGRESO', field: 'ingreso', visible: true },
  ];

  // columnas para vista por empresa (detalle por empleado)
  employeeColumns: { label: string; field: string; visible: boolean }[] = [
    { label: 'PERIODO', field: 'periodo', visible: true },
    { label: 'ID EMPLEADO', field: 'fcIdEmpleado', visible: true },
    { label: 'NOMBRE COMPLETO', field: 'fcNombreCompleto', visible: true },
    { label: 'GASTO', field: 'gasto', visible: true },
    { label: 'INGRESO', field: 'ingreso', visible: true },
    { label: 'DIFERENCIA (Ingreso - Gasto)', field: 'diferencia', visible: true },
  ];

  get visibleColumns(): any[] {
    if (this.isDrilled) {
      return this.employeeColumns.filter(c => c.visible);
    }
    return this.columnas.filter(col => {
      if (!col.visible) return false;
      if (this.title === 'Reporte Gastos' && col.field === 'fcEmpresa') return false;
      return true;
    });
  }

  ngOnInit(): void {
    this.expenseReport = [];
    this.loadExpenseReport();
  }

  constructor(private expenseReportService: ExpenseReportService) { }

  getTotalRegistros(): number {
    return this.expenseReport.length;
  }

  viewCompaniesByPeriod(item: any): void {
    if (!item || item.periodo == null) return;
    const periodo = item.periodo;
    this.expenseReportService.getReportByPeriod({ periodo }).subscribe({
      next: (response) => {
        try {
          let parsed: any = null;
          if (typeof response === 'string') {
            try { parsed = JSON.parse(response); }
            catch {
              const encryptSvc = (this.expenseReportService as any).encrypt;
              if (encryptSvc && typeof encryptSvc.decryptRes === 'function') {
                parsed = JSON.parse(encryptSvc.decryptRes(response));
              } else { throw new Error('Respuesta no es JSON y no hay decrypt'); }
            }
          } else {
            parsed = response;
          }

          const candidate = parsed.resultado ?? parsed.data ?? parsed;
          if (Array.isArray(candidate)) {
            this.expenseReport = (candidate as any[]).map(row => ({
              periodo: row.periodo,
              fiIdEmpresa: row.fiIdEmpresa ?? null,
              fcEmpresa: row.fcEmpresa ?? row.empresa ?? '',
              empleados: Number(row.empleados ?? 0),
              gasto: Number(row.gasto ?? 0),
              ingreso: Number(row.ingreso ?? 0)
            }));
            this.title = `Reporte Gastos - Periodo ${periodo}`;
            this.isShowingCompanies = true;
            this.isDrilled = false;
            this.iconExit = true;
            this.showChart = false;
          } else {
            this.expenseReport = [];
          }
        } catch (err) {
          this.expenseReport = [];
        }
      },
      error: (err) => {
        console.error('Error fetching reportByPeriod:', err);
        this.expenseReport = [];
      }
    });
  }

  loadExpenseReport(): void {
    const request = {};
    this.expenseReportService.getExpenseReport(request).subscribe({
      next: (response) => {
        console.log('raw expenseReport response:', response);
        try {
          let parsed: any = null;

          if (typeof response === 'string') {
            try {
              parsed = JSON.parse(response);
            } catch {
              const encryptSvc = (this.expenseReportService as any).encrypt;
              if (encryptSvc && typeof encryptSvc.decryptRes === 'function') {
                const decryptedText = encryptSvc.decryptRes(response);
                parsed = JSON.parse(decryptedText);
              } else {
                throw new Error('Respuesta no es JSON y no hay método de desencriptado disponible');
              }
            }
          } else if (typeof response === 'object' && response !== null) {
            parsed = response;
            if (parsed.data && typeof parsed.data === 'string') {
              try { parsed.data = JSON.parse(parsed.data); } catch {}
            }
          } else {
            throw new Error('Tipo de respuesta inesperado');
          }

           const candidate = parsed.resultado ?? parsed.data ?? parsed;

          if (Array.isArray(candidate)) {
            this.isDrilled = false;
            this.drilledEmpresaId = null;
            this.drilledCompanyName = null;
            this.expenseReport = (candidate as any[]).map(item => ({
              periodo: item.periodo,
              fiIdEmpresa: item.fiIdEmpresa ?? null,
              fcEmpresa: item.fcEmpresa ?? item.empresa ?? '',
              empleados: Number(item.empleados ?? 0),
              gasto: Number(item.gasto ?? 0),
              ingreso: Number(item.ingreso ?? 0)
            }));
          } else {
            this.expenseReport = [];
          }
         } catch (err) {
           this.expenseReport = [];
           this.showChart = false;
         }
       },
      error: (error) => {
        this.expenseReport = [];
        this.showChart = false;
      }
    });
  }

  sortByColumn(column: Columna): void {
    const field = column.field;
    if (this.sortColumn === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = field;
      this.sortDirection = 'asc';
    }

    this.expenseReport.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA == null && valB == null) return 0;
      if (valA == null) return this.sortDirection === 'asc' ? -1 : 1;
      if (valB == null) return this.sortDirection === 'asc' ? 1 : -1;
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private get maxChartValue(): number {
    if (!Array.isArray(this.expenseReport) || this.expenseReport.length === 0) return 1;
    let max = 0;
    for (const r of this.expenseReport) {
      const gasto = Number(r.gasto || 0);
      const ingreso = Number(r.ingreso || 0);
      if (gasto > max) max = gasto + gasto * 0.2;
      if (ingreso > max) max = ingreso + ingreso * 0.2;
    }
    return max > 0 ? max : 1;
  }

  get chartWidth(): number {
    const n = Math.max(1, this.expenseReport.length);
    return Math.max(480, n * 80);
  }

  private get chartInnerHeight(): number {
    return this.chartHeight - this.paddingTop - this.paddingBottom;
  }

  private get xStep(): number {
    const n = Math.max(1, this.expenseReport.length - 1);
    return n === 0 ? (this.chartWidth - this.paddingLeft - this.paddingRight) : (this.chartWidth - this.paddingLeft - this.paddingRight) / n;
  }

  // puntos para la serie "precios" (rojo) -> fiGasto
  get pointsPrecios(): string {
    return this.buildPoints((r) => Number(r.gasto || 0));
  }

  // puntos para la serie "ganancias" (azul) -> fiIngreso
  get pointsGanancias(): string {
    return this.buildPoints((r) => Number(r.ingreso || 0));
  }

  // coordenadas arrays para dibujar círculos y etiquetas
  get coordsPrecios(): { x: number; y: number }[] {
    return this.buildCoords((r) => Number(r.gasto || 0));
  }
  get coordsGanancias(): { x: number; y: number }[] {
    return this.buildCoords((r) => Number(r.ingreso || 0));
  }

  // etiquetas X
  get xLabels(): { x: number; label: string }[] {
    return (this.expenseReport || []).map((r, i) => {
      const x = this.paddingLeft + i * this.xStep;
      return { x, label: String(r.periodo) };
    });
  }

  // ticks Y para grid (5 ticks)
  get yTicks(): { y: number; label: number }[] {
    const max = this.maxChartValue;
    const steps = 5;
    const ticks: { y: number; label: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const val = Math.round(max * (1 - i / steps));
      const y = this.paddingTop + (this.chartInnerHeight) * (i / steps);
      ticks.push({ y, label: val });
    }
    return ticks;
  }

  private buildPoints(valueFn: (r: ExpenseReport) => number): string {
    if (!Array.isArray(this.expenseReport) || this.expenseReport.length === 0) return '';
    const max = this.maxChartValue;
    const points: string[] = [];
    (this.expenseReport || []).forEach((r, i) => {
      const x = this.paddingLeft + i * this.xStep;
      const val = valueFn(r);
      const ratio = max === 0 ? 0 : val / max;
      const y = this.paddingTop + (1 - ratio) * this.chartInnerHeight;
      points.push(`${x},${y}`);
    });
    return points.join(' ');
  }

  private buildCoords(valueFn: (r: ExpenseReport) => number): { x: number; y: number }[] {
    if (!Array.isArray(this.expenseReport) || this.expenseReport.length === 0) return [];
    const max = this.maxChartValue;
    return (this.expenseReport || []).map((r, i) => {
      const x = this.paddingLeft + i * this.xStep;
      const val = valueFn(r);
      const ratio = max === 0 ? 0 : val / max;
      const y = this.paddingTop + (1 - ratio) * this.chartInnerHeight;
      return { x, y };
    });
  }

  toggleChart(): void {
    this.showChart = !this.showChart;
  }

  // detalle por empresa
  drillToCompany(item: any): void {
    if (!item || item.fiIdEmpresa == null) return;
    const periodo = item.periodo;
    const empresaId = item.fiIdEmpresa;
    this.expenseReportService.getReportByPeriodAndCompany({ periodo, empresaId }).subscribe({
      next: (response) => {
        try {
          let parsed: any = null;
          if (typeof response === 'string') {
            try { parsed = JSON.parse(response); }
            catch {
              const encryptSvc = (this.expenseReportService as any).encrypt;
              if (encryptSvc && typeof encryptSvc.decryptRes === 'function') {
                parsed = JSON.parse(encryptSvc.decryptRes(response));
              } else { throw new Error('Respuesta no es JSON y no hay decrypt'); }
            }
          } else {
            parsed = response;
          }

          const candidate = parsed.resultado ?? parsed.data ?? parsed;
          if (Array.isArray(candidate)) {
            // mapear detalle por empleado y calcular diferencia
            this.expenseReport = (candidate as any[]).map(row => {
              const gasto = Number(row.gasto ?? 0);
              const ingreso = Number(row.ingreso ?? 0);
              return {
                periodo: row.periodo,
                fiIdEmpresa: row.fiIdEmpresa ?? empresaId,
                fcEmpresa: row.fcEmpresa ?? item.fcEmpresa ?? '',
                fcIdEmpleado: row.fcIdEmpleado ?? row.fcIdEmpleado ?? '',
                fcNombreCompleto: row.fcNombreCompleto ?? row.fcNombreCompleto ?? '',
                gasto,
                ingreso,
                diferencia: ingreso - gasto
              };
            });
            this.isDrilled = true;
            this.isShowingCompanies = false;
            this.drilledEmpresaId = empresaId;
            this.drilledCompanyName = (this.expenseReport[0]?.fcEmpresa) ?? item.fcEmpresa ?? '';
            this.iconExit = true;
            this.showChart = false;
          } else {
            this.expenseReport = [];
          }
        } catch (err) {
          this.expenseReport = [];
        }
      },
      error: (err) => {
        this.expenseReport = [];
      }
    });
  }

  closeReporOfPeriod(): void {
    this.title = 'Reporte Gastos';
    this.isDrilled = false;
    this.drilledEmpresaId = null;
    this.drilledCompanyName = null;
    this.iconExit = false;
    this.isShowingCompanies = false;
    this.loadExpenseReport();
  }

  exportToExcel(): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.title || 'Reporte');
    const columnasVisibles = this.visibleColumns;
    const encabezados = columnasVisibles.map(col => col.label);
    worksheet.addRow(encabezados);
    worksheet.columns = columnasVisibles.map(col => ({
      header: col.label,
      key: col.field,
      width: 20
    }));

    encabezados.forEach((_, idx) => {
      const cell = worksheet.getCell(1, idx + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF017D91' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    this.expenseReport.forEach((reporte, i) => {
      const rowData = columnasVisibles.map(col => (reporte as any)[col.field] != null ? (reporte as any)[col.field] : '');
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFB3E5FC' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    worksheet.getRow(1).height = 20;
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${this.title || 'Reporte'}.xlsx`);
    });
  }

  get totalDifference(): number {
    if (!this.isDrilled || !Array.isArray(this.expenseReport)) return 0;
    return this.expenseReport.reduce((acc, r) => acc + (Number(r.ingreso || 0) - Number(r.gasto || 0)), 0);
  }

  onRowClick(report: any): void {
    console.log('row clicked', { report, isDrilled: this.isDrilled, isShowingCompanies: this.isShowingCompanies });
    if (this.isDrilled) {
      return;
    }
    if (!report) return;

    if (!this.isShowingCompanies && this.title === 'Reporte Gastos') {
      this.viewCompaniesByPeriod(report);
      return;
    }

    if (this.isShowingCompanies) {
      if (!report.fiIdEmpresa && report.fiIdEmpresa !== 0) {
        console.warn('Fila sin fiIdEmpresa, no se puede hacer drill a empresa:', report);
        return;
      }
      this.drillToCompany(report);
      return;
    }
  }
}
