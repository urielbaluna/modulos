import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

import { Periodos, Columna } from '../../../core/models/upload-ca';
import { UploadCaService } from '../../../core/services/upload-ca.service';

@Component({
  selector: 'app-upload-ca',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './upload-ca.component.html',
  styleUrl: './upload-ca.component.css'
})
export class UploadCaComponent implements OnInit {
  searchText: string = '';
  data: Periodos[] = [];
  originalRow: any = null;
  filteredData: Periodos[] = [];
  showColumnMenu: boolean = false;
  sortColumn: keyof Periodos | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedRows: any[] = [];
  selectedFile: File | null = null;
  selectedFileName: string = '';
  selectedFileBase64: string = '';
  fcOdc: string = '';
  fdFechaOdc: string = '';

  columnas: Columna[] = [
    { label: 'AÑO', field: 'fiAnio', visible: true },
    { label: 'MES NÚMERO', field: 'fiMes', visible: false },
    { label: 'MES', field: 'fcMes', visible: true },
    { label: 'ID EMPLEADO', field: 'fcIdEmpleado', visible: false },
    { label: 'EMPLEADO', field: 'fcEmpleado', visible: true },
    { label: 'ID CLIENTE', field: 'fiIdEmpresa', visible: false },
    { label: 'CLIENTE', field: 'fcEmpresa', visible: true },
    { label: 'TARIFA', field: 'fdTarifa', visible: true },
    { label: 'ID ASIGNACION', field: 'fiIdAsignacion', visible: false },
    { label: 'ID PERIODO FACTURACION', field: 'fiIdPeriodoFact', visible: false },
  ];

  constructor(private uploadCaService: UploadCaService, private toast: ToastService) { }

  ngOnInit(): void {
    this.data = [];
  }

  //Obtiene la data de los periodos que devuelve el servicio
  cosultarPeriodos(){
    const request = { cadena: this.searchText };
    this.uploadCaService.getPeriods(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const data: Periodos[] = json.resultado;
        this.data = data;
        this.filteredData = data;
        this.toast.success('Registros cargados', 'Exitosamente');
      },
      error: (err) => {
        this.toast.error('Error al obtener el reporte: ', 'Intente nuevamente');
        this.data = [];
      }
    });
  }

  //Filtra la tabla si el usuario escribe algo y no busca todos los registros existentes
  isValidSearch(text: string): boolean {
    return !!text && text.trim().length > 0 && /[a-zA-Z0-9]/.test(text);
  }

  //obtiene el numero del total de registros
  getTotalRegistros(): number {
    return this.data.length;
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

  //funciones para manejar las filas seleccionadas
  toggleRowSelection(row: any) {
    const index = this.selectedRows.indexOf(row);
    if (index > -1) {
      this.selectedRows.splice(index, 1);
    } else {
      this.selectedRows.push(row); 
    }
  }
  isRowSelected(row: any): boolean {
    return this.selectedRows.indexOf(row) > -1;
  }
  areAllRowsSelected(): boolean {
    return this.selectedRows.length === this.filteredData.length && this.filteredData.length > 0;
  }
  toggleSelectAll(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedRows = [...this.filteredData];
    } else {
      this.selectedRows = [];
    }
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

  // Convierte fechas de yyyy-MM-dd a dd/MM/yyyy para la API
  toApiFecha(fecha: string): string {
    if (!fecha) return '';
    const parts = fecha.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fecha.replace(/-/g, '/');
  }

  // Actualiza la ODC y sube la carta de aceptación
  updateSelectedODC(): void {
    if (this.selectedRows.length === 0) {
      this.toast.error('Seleccione al menos un periodo para actualizar la ODC.', '');
      return;
    }
    if (!this.fcOdc || this.fcOdc.trim() === '' || !this.fdFechaOdc || this.fdFechaOdc.trim() === '') {
      this.toast.error('Ingrese el número de ODC y la fecha de ODC.', '');
      return;
    }
    if (!this.selectedFileBase64 || this.selectedFileBase64.trim() === '') {
      this.toast.error('Seleccione un archivo PDF de Carta de Aceptación.', '');
      return;
    }
    const formattedDate = this.toApiFecha(this.fdFechaOdc);
    const periodos = this.selectedRows.map(row => ({
      fiIdPeriodoFact: row.fiIdPeriodoFact,
      fiIdAsignacion: row.fiIdAsignacion,
      fiIdEmpresa: row.fiIdEmpresa,
      fiIdEmpleado: row.fcIdEmpleado
    }));
    const request = {
      fcCartaAceptacion: this.fcOdc,
      fdFechaOdc: formattedDate,
      fcDocumento: this.selectedFileBase64,
      periodos: periodos,
      nombre: this.selectedFileName,
      tipo: 'application/pdf'
    };
    this.uploadCaService.uploadCaFile(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        if (json.estatus === 'OK') {
          this.toast.success('Carta de Aceptación y ODC actualizadas exitosamente.', '');
          this.selectedRows = [];
          this.fcOdc = '';
          this.fdFechaOdc = '';
          this.removeFile();
          this.cosultarPeriodos();
        } else {
          this.toast.error('Error al actualizar: ', 'Intente nuevamente');
        }
      },
      error: (err) => {
        this.toast.error('Error al actualizar: ', 'Intente nuevamente');
      }
    });
  }
}
