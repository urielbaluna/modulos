import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

import { CFDIs, Columna } from '../../../core/models/payment-record';
import { PaymentsRecordService } from '../../../core/services/payments-record.service';

@Component({
  selector: 'app-payment-record',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment-record.component.html',
  styleUrl: './payment-record.component.css'
})
export class PaymentRecordComponent implements OnInit {
  searchText: string = '';
  data: CFDIs[] = [];
  filteredData: CFDIs[] = [];
  showColumnMenu: boolean = false;
  sortColumn: keyof CFDIs | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedFile: File | null = null;
  selectedFileName: string = '';
  selectedFileBase64: string = '';
  fdFechaPago: string = '';

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

  constructor(private paymentsRecordService: PaymentsRecordService,private toast: ToastService) { }

  ngOnInit(): void {
    this.data = [];
  }

  cosultarconCFDI(){
    const request = { fcCfdi: this.searchText };
    this.paymentsRecordService.getRecords(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const data: CFDIs[] = json.resultado;
        this.data = data;
        this.filteredData = data;
        this.toast.success('Registros cargados', 'Exitosamente');
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
  // Maneja la selección del archivo
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.toast.error('Solo se permiten archivos PDF.', '');
        this.selectedFile = null;
        this.selectedFileName = '';
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
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

  updatePagoCFDI() {
    if (!this.selectedFileBase64) {
      this.toast.error('Por favor, selecciona un archivo PDF antes de actualizar.', '');
      return;
    }
    if (!this.fdFechaPago) {
      this.toast.error('Por favor, ingresa la fecha de pago antes de actualizar.', '');
      return;
    }
    const request = {
      fcCfdi: this.searchText,
      fdFechaPago: this.toApiFecha(this.fdFechaPago),
      documentoBase64: this.selectedFileBase64,
      nombre: this.selectedFileName,
      tipo: 'application/pdf'
    };
    this.paymentsRecordService.updatdeCFDI(request).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
          if (json.estatus === 'OK') {
            this.toast.success('CFDI actualizado correctamente.', 'Éxito');
            this.removeFile();
            this.fdFechaPago = '';
            this.cosultarconCFDI();
          } else {
            this.toast.error('Error al actualizar el estatus: ', 'Intente nuevamente');
          }
      },
      error: (error) => {
        this.toast.error('Error al actualizar el CFDI.', 'Error');
      }
    });
  }
}
