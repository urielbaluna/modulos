import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { GeneralFinancialReportService } from '../../../core/services/general-financial-report.service';
import { Reporte, Columna } from '../../../core/models/general-financial-report';

@Component({
  selector: 'app-general-financial-report',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './general-financial-report.component.html',
  styleUrl: './general-financial-report.component.css'
})
export class GeneralFinancialReportComponent implements OnInit {
  searchText: string = '';
  data: Reporte[] = [];
  originalRow: any = null;
  filteredData: Reporte[] = [];
  showColumnMenu: boolean = false;
  sortColumn: keyof Reporte | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedRowRef: any = null;
  selectedRow: Reporte | null = null;
  showModal: boolean = false;
  isEditing: boolean = false;
  showStatusModal = false; 
  selectedFileName: string = '';
  selectedFileBase64: string = '';
  selectedFile: File | null = null;
  statusOptions: { id: number, descripcion: string }[] = []; 

  //Definición de columnas
  columnas: Columna[] = [
    { label: 'RIESGO', field: 'fcRiesgo', visible: true },
    { label: 'ESTATUS', field: 'fcStatus', visible: true },
    { label: 'ID PERIODO', field: 'fiIdPeriodo', visible: true },
    { label: 'ID ASIGNACION', field: 'fiIdAsignacion', visible: false },
    { label: 'ID EMPRESA', field: 'fiIdEmpresa', visible: false },
    { label: 'EMPRESA', field: 'fcEmpresa', visible: true },
    { label: 'ID EMPLEADO', field: 'fiIdEmpleado', visible: false },
    { label: 'EMPLEADO', field: 'fcEmpleado', visible: true },
    { label: 'ID STATUS', field: 'fiIdStatus', visible: false },
    { label: 'FECHA INICIAL', field: 'fdFechaInicial', visible: true },
    { label: 'FECHA FINAL', field: 'fdFechaFinal', visible: true },
    { label: 'FECHA REGISTRO', field: 'fdFechaRegistro', visible: true },
    { label: 'AÑO', field: 'fiAnio', visible: true },
    { label: 'MES NÚMERO', field: 'fiMes', visible: false },
    { label: 'MES TEXTO', field: 'fcMes', visible: false },
    { label: 'MES', field: 'mes', visible: true },
    { label: 'CA', field: 'fcOdc', visible: true },
    { label: 'FECHA CA', field: 'fdFechaOdc', visible: true },
    { label: 'CFDI', field: 'fcCfdi', visible: true },
    { label: 'FECHA CFDI', field: 'fdFechaCfdi', visible: true },
    { label: 'FECHA PAGO', field: 'fdFechaPago', visible: true },
    { label: 'COMENTARIOS', field: 'fcComentarios', visible: false },
    { label: 'MONTO PAGO', field: 'fiMontoPago', visible: true },
    { label: 'ORDEN', field: 'fiOrden', visible: false },
    { label: 'FECHA BITACORA', field: 'fdFechaBitacora', visible: false },
    { label: 'TARIFA', field: 'fiTarifa', visible: true },
  ];

  constructor(private reportService: GeneralFinancialReportService, private toast: ToastService) {}

  ngOnInit(): void {
    this.data = [];
  }

  //Obtiene el reporte general
  consultarReporte() {
    const request = { cadena: this.searchText };
    this.reportService.getReportGeneral(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const data: Reporte[] = json.resultado;
        this.data = data;
        this.filteredData = data;
        this.toast.success('Reporte cargado', 'Exitosamente');
      },
      error: (err) => {
        this.toast.error('Error al obtener el reporte: ', 'Intente nuevamente');
        this.data = [];
      }
    });
  }

  //Valida la búsqueda no este vacía o haga busquedas cuando solo hay espacios
  isValidSearch(text: string): boolean {
    return !!text && text.trim().length > 0 && /[a-zA-Z0-9]/.test(text);
  }

  //Cuenta el total de registros
  getTotalRegistros(): number {
    return this.data.length;
  }

  //Descarga el reporte en Excel
  downloadExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Encabezados
    const columnasVisibles = this.columnas.filter(col => col.visible && col.field !== 'fcRiesgo');
    const encabezados = columnasVisibles.map(col => col.label);
    worksheet.addRow(encabezados);


    worksheet.columns = columnasVisibles.map(col => ({
      header: col.label,
      key: col.field,
      width: 20
    }));

    // Estilo encabezados
    encabezados.forEach((_, idx) => {
      worksheet.getCell(1, idx + 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF017D91' }
      };
      worksheet.getCell(1, idx + 1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    });

    // Datos y alternancia de color
    this.filteredData.forEach((reporte, i) => {
      const rowData = columnasVisibles.map(col => reporte[col.field] != null ? reporte[col.field] : '');
      const row = worksheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFB3E5FC' } 
        };
      });
    });

    // Descargar archivo
    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(new Blob([buffer]), 'ReporteGeneral.xlsx');
    });
  }

  //Ordena las columnas
  sortByColumn(col: Columna) {
    if (this.sortColumn === col.field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col.field;
      this.sortDirection = 'asc';
    }
    this.filteredData.sort((a, b) => {
      const valA = a[col.field];
      const valB = b[col.field];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return this.sortDirection === 'asc'
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  }

  openModal(row: Reporte) {
    this.selectedRowRef = row; 
    this.selectedRow = { ...row };
    this.selectedRow.fdFechaInicial = this.convertGuionToSlash(this.selectedRow.fdFechaInicial);
    this.selectedRow.fdFechaFinal = this.formatDateForInput(this.selectedRow.fdFechaFinal);
    this.selectedRow.fdFechaOdc = this.formatDateForInput(this.selectedRow.fdFechaOdc);
    this.selectedRow.fdFechaCfdi = this.formatDateForInput(this.selectedRow.fdFechaCfdi);
    this.selectedRow.fdFechaPago = this.formatDateForInput(this.selectedRow.fdFechaPago);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.selectedRowRef = null;
    this.selectedRow = null;
  }

  // Convierte fechas de dd/MM/yyyy o dd-MM-yyyy a yyyy-MM-dd para inputs de tipo date
  formatDateForInput(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.includes('/') ? fecha.split('/') : fecha.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return fecha;
  }
  // Convierte fechas de yyyy-MM-dd a dd/MM/yyyy para la API
  toApiFecha(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fecha.replace(/-/g, '/');
  }
  // Convierte fechas de yyyy-MM-dd o yyyy/MM/dd a dd/MM/yyyy para mostrar en pantalla
  formatFechaSlash(fecha: string): string {
    if (!fecha || fecha === 'null' || fecha === 'undefined') return '';
    const parts = fecha.includes('-') ? fecha.split('-') : fecha.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return '';
  }
  // Convierte fechas de dd-MM-yyyy a dd/MM/yyyy para mostrar en pantalla
  convertGuionToSlash(fecha: string): string {
    if (!fecha) return '';
    return fecha.replace(/-/g, '/');
  }

  //Llama al servicio para actualizar el periodo y cambia las fechas al formato requerido por la API
  actualizarPeriodo() {
    if (this.selectedRow) {
      const request = { ...this.selectedRow };
      request.fdFechaInicial  = this.toApiFecha(this.formatDateForInput( request.fdFechaInicial));
      request.fdFechaFinal   = this.toApiFecha(request.fdFechaFinal);
      request.fdFechaOdc     = this.toApiFecha(request.fdFechaOdc);
      request.fdFechaCfdi    = this.toApiFecha(request.fdFechaCfdi);
      request.fdFechaPago    = this.toApiFecha(request.fdFechaPago);
      request.fdFechaRegistro = this.toApiFecha(this.formatDateForInput(request.fdFechaRegistro));
      console.log(request);
      
      this.reportService.updateReportPeriod(request).subscribe({
        next: (response: string) => {
          const json = JSON.parse(response);
          console.log(json);
          
          if (json.estatus === 'OK') {
            this.consultarReporte();
            this.toast.success('Periodo actualizado', 'Exitosamente');
          } else {
            this.consultarReporte();
            this.toast.error('Error al actualizar el periodo: ', "Datos inválidos");
          }
        },
        error: (err) => {
          this.consultarReporte();
          this.toast.error('Error al actualizar el periodo: ', "Datos inválidos");
        }
      });
    }
  }

  consultStatus() {
    if (!this.selectedRow) return;
    const request = { fiIdStatus: this.selectedRow.fiIdStatus };
    this.reportService.getReportStatus(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const data: any = json.resultado;
        if (data && data.length > 0) {
          this.statusOptions = data.map((item: any) => ({
            id: item.fiIdStatus,
            descripcion: item.fcDescripcion
          }));
          if (this.selectedRow && this.statusOptions.length > 0) {
            this.selectedRow.fiIdStatus = this.statusOptions[0].id;
          }
        } else {
          this.toast.error('Error al obtener el estatus', 'Intente nuevamente');
        }
      },
      error: (err) => {
        this.toast.error('Error al obtener el estatus', 'Intente nuevamente');
      }
    });
  }

  openStatusModal(row: any) {
    this.selectedRow = row;
    this.originalRow = { ...row };
    this.consultStatus();
    this.showStatusModal = true;
    this.showModal = false;
  }

  closeStatusModal() {
    if (this.selectedRow && this.originalRow) {
      Object.assign(this.selectedRow, this.originalRow);
    }
    this.showStatusModal = false;
    this.showModal = true;
    this.selectedFileName = '';
  }

   // Maneja la selección del archivo
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Solo permitir PDFs
      if (file.type !== 'application/pdf') {
        this.toast.error('Solo se permiten archivos PDF.', '');
        this.selectedFile = null;
        this.selectedFileName = '';
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;

      // Convertir a base64
      const reader = new FileReader();
      reader.onload = () => {
        // El resultado es una cadena base64
        const base64String = (reader.result as string).split(',')[1];
        // Guarda el base64 en una variable para enviar por la API
        this.selectedFileBase64 = base64String;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.selectedFileBase64 = '';
    }
  }
  removeFile(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  actualizarEstatus(): void {
    if (this.selectedRow) {
      const request = { ...this.selectedRow };
      request.fdFechaRegistro = this.toApiFecha(this.formatDateForInput(request.fdFechaRegistro));
      request.documentoBase64 = this.selectedFileBase64;
      request.nombre = this.selectedFileName;
      request.fdFechaCfdi = this.toApiFecha(request.fdFechaCfdi);
      request.fdFechaOdc = this.toApiFecha(request.fdFechaOdc);
      request.fdFechaPago = this.toApiFecha(request.fdFechaPago);
      request.fdFechaBitacora = this.toApiFecha(this.formatDateForInput(request.fdFechaBitacora));
      this.reportService.updateStatusPeriodo(request).subscribe({
        next: (response: string) => {
          const json = JSON.parse(response);
          if (json.estatus === 'OK') {
            this.consultarReporte();
            this.toast.success('Estatus actualizado', 'Exitosamente');
            this.showStatusModal = false;
            this.showModal = false;
          } else {
            this.toast.error('Error al actualizar el estatus: ', 'Intente nuevamente');
          }
        },
        error: (err) => {
          this.toast.error('Error al actualizar el estatus: ', 'Intente nuevamente');
        }
      });
    }
    this.closeStatusModal();
  }
}
