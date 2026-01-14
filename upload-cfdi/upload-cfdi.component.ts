import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

import { Cartas, Columna } from '../../../core/models/upload-cfdi';
import { UploadCfdiService } from '../../../core/services/upload-cfdi.service';
@Component({
  selector: 'app-upload-cfdi',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './upload-cfdi.component.html',
  styleUrl: './upload-cfdi.component.css'
})
export class UploadCfdiComponent implements OnInit {
  searchText: string = '';
  data: Cartas[] = [];
  filteredData: Cartas[] = [];
  showColumnMenu: boolean = false;
  sortColumn: keyof Cartas | null = null;
  sortDirection: 'asc' | 'desc' = 'asc'
  selectedFile: File | null = null;
  selectedFileName: string = ''
  selectedFileBase64: string = '';
  fiMontoPago: number | null = null;
  fcCfdi: number | null = null;
  fdFechaPago: string = '';
  fdFechaCfdi: string = '';
  fiOrdenServicio: number | null = null;


  columnas: Columna[] = [
    { label: 'CA', field: 'fcOdc', visible: true },
    { label: 'AÑO', field: 'fiAnio', visible: true },
    { label: 'ID ASIGNACIÓN', field: 'fiIdAsignacion', visible: false },
    { label: 'ID PERIODO', field: 'fiIdPeriodo', visible: false },
    { label: 'MES NÚMERO', field: 'fiMes', visible: false },
    { label: 'MES', field: 'fcMes', visible: true },
    { label: 'ID EMPLEADO', field: 'fiIdEmpleado', visible: false },
    { label: 'EMPLEADO', field: 'fcEmpleado', visible: true },
    { label: 'ID EMPRESA', field: 'fiIdEmpresa', visible: false },
    { label: 'EMPRESA', field: 'fcEmpresa', visible: true },
    { label: 'TARIFA', field: 'fiTarifa', visible: true }
  ];

  constructor(private uploadCfdiService: UploadCfdiService, private toast: ToastService) { }

  ngOnInit(): void {
    this.data = [];
  }

  //Obtiene la data de los registros que devuelve el servicio
  consultarCartas(){
    const request = { fcOdc: this.searchText };
    this.uploadCfdiService.getRecords(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const data: Cartas[] = json.resultado;
        this.data = data;
        this.filteredData = data;
        this.toast.success('Registros cargados', 'Exitosamente');
      },
      error: (err) => {
        this.toast.error('Error al cargar los registros', 'Intente nuevamente');
        console.error('Error fetching records:', err);
      }
    });
  }

  //Verifica que el texto de busqueda no este vacio
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

  //Funcion para actualizar el CFDI de los registros encontrados
  updateCFDI(): void {
    if (!this.fcCfdi || !this.fdFechaCfdi || !this.fiMontoPago || !this.selectedFileBase64) {
      this.toast.error('Por favor, complete todos los campos y seleccione un archivo.', '');
      return;
    }
    const request = {
      fcCa: this.searchText,
      fiOrdenServicio: this.fiOrdenServicio || null,
      fcCfdi: this.fcCfdi,
      fdFechaCfdi: this.toApiFecha(this.fdFechaCfdi),
      fiMontoPago: this.fiMontoPago,
      documentoBase64: this.selectedFileBase64,
      nombre: this.selectedFileName,
      tipo: 'application/pdf'
    };
    this.uploadCfdiService.updateCfdi(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        if (json.estatus === 'OK') {
          this.toast.success('CFDI actualizado correctamente', '');
          this.consultarCartas();
          this.fiOrdenServicio = null;
          this.fcCfdi = null;
          this.fdFechaCfdi = '';
          this.fiMontoPago = null;
          this.selectedFile = null;
          this.selectedFileName = '';
          this.selectedFileBase64 = '';
        } else {
          this.toast.error('Error al actualizar el CFDI', 'Intente nuevamente');
        }
      },
      error: (err) => {
        this.toast.error('Error al actualizar el CFDI', 'Intente nuevamente');
      }
    });
  }
}
