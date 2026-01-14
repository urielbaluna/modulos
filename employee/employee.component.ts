import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { GoogleMapsModule } from '@angular/google-maps';

import { enviroment } from '../../../enviroment';
import { MapsLoaderService } from '../../../core/services/maps-loader.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee, Columna, UploadedFile, CivilStatus, AvailableTechnologies, Banks, TypeOfReferences, EmployeeAddress, Countries, States, Municipalities, Colonies, Reference } from '../../../core/models/employee';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [FormsModule, CommonModule, GoogleMapsModule, ReactiveFormsModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent implements OnInit {
  searchText: string = '';
  data: Employee[] = [];
  filteredData: Employee[] = []
  showColumnMenu: boolean = false;
  sortColumn: keyof Employee | null = null
  sortDirection: 'asc' | 'desc' = 'asc';
  title = 'Empleados';
  newEmployee = false;
  viewEmployee = false;
  currentStep = 1;
  search = true;
  selectedCivilStatus: number | '' = '';
  selectedProfile: number | '' = '';
  selectedBank: number | '' = '';
  selectedReference1Type: number | '' = '';
  selectedReference2Type: number | '' = '';
  selectedReference3Type: number | '' = '';
  civilStatuses: CivilStatus[] = [];
  profiles: AvailableTechnologies[] = [];
  tipoReferencia: TypeOfReferences[] = [];
  inputsEditables: boolean = false;
  bancos: Banks[] = [];
  private lookupsLoaded = false;
  employeeData: Partial<Employee> = {};
  showBajaEmployeeModal: boolean = false;
  showVetaEmployeeModal: boolean = false;
  bajaReason: string = '';
  vetarReason: string = '';
  showProspectDropdown: boolean = false;
  employeeAddress: EmployeeAddress = {
    fiIdDoEmpleado: 0,
    fiIdEmpleado: '',
    fcCalle: '',
    fcNumInt: null,
    fcNumExt: null,
    fiIdEstado: null,
    fcEstado: null,
    fiIdMunicipio: null,
    fcMunicipio: null,
    fiIdColonia: null,
    fcColonia: null,
    fiCp: null,
    fiIdPais: 1
  };
  addressLoaded: boolean = false;
  countries: Countries[] = [
    { fiIdPais: 1, fcPais: 'México' }
  ];
  states: States[] = [];
  allStates: States[] = [];
  municipalities: Municipalities[] = [];
  colonies: Colonies[] = [];
  showMapsModal: boolean = false;
  addressForm!: FormGroup;
  center: { lat: number; lng: number } = { lat: 19.4326, lng: -99.1332 };
  zoom = 12;
  markerPosition: { lat: number; lng: number } | null = null;
  googleMapsLoaded = false;
  showHomonimiasModal: boolean = false;
  homonimias: any[] = [];
  references: Reference[] = [];
  btnUpdateEmployeeExistents: boolean = false;
  btnActivateEmployeeExistents: boolean = false;
  colonieZipCode: boolean = true;

  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;

  uploadedFiles: Array<{ file: File; id: number }> = [];
  requirements: any[] = [];
  isDragging = false;
  fileCounter = 0;

  hasUnassignedRequirements(): boolean {
    if (!Array.isArray(this.requirements)) return false;

    const totalRequirements = this.requirements.length;
    const assignedCount = this.requirements.filter(r => !!(r as any).assignedFile).length;
    const pendingCount = Array.isArray(this.uploadedFiles) ? this.uploadedFiles.length : 0;
    return (pendingCount + assignedCount) < totalRequirements;
  }

  columnas: Columna[] = [
      { label: 'RFC', field: 'fiIdEmpleado', visible: true },
      { label: 'NOMBRE', field: 'fcNombre', visible: true },
      { label: 'APELLIDO PATERNO', field: 'fcPaterno', visible: true },
      { label: 'APELLIDO MATERNO', field: 'fcMaterno', visible: true },
      { label: 'FECHA DE NACIMIENTO', field: 'fdFechaNac', visible: true },
      { label: 'NSS', field: 'fcNss', visible: false },
      { label: 'CURP', field: 'fcCurp', visible: false },
      { label: 'CELULAR', field: 'fcNumero', visible: false },
      { label: 'EMAIL', field: 'fcMail', visible: true },
      { label: 'FECHA DE INGRESO', field: 'fdFechaAlta', visible: true },
      { label: 'ESTADO CIVIL', field: 'fcEstadoCivil', visible: false },
      { label: 'PERFIL', field: 'fcTecnologia', visible: false }
  ];

  constructor(
    private employeeService: EmployeeService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private gmapsLoader: MapsLoaderService
  ) { }

  ngOnInit(): void {
    this.data = []
    this.addressForm = this.fb.group({
      street: [''],
      neighborhood: [''],
      city: [''],
      country: ['']
    });
    if (!this.employeeAddress) this.employeeAddress = {} as any;
    this.employeeAddress.fiIdPais = this.employeeAddress.fiIdPais ?? 1;
    this.employeeAddress.fiIdEstado = this.employeeAddress.fiIdEstado ?? null;
    this.employeeAddress.fiIdMunicipio = this.employeeAddress.fiIdMunicipio ?? null;
    this.employeeAddress.fiIdColonia = this.employeeAddress.fiIdColonia ?? null;
  }

  private loadLookups() {
    if (this.lookupsLoaded) {
      return of(void 0);
    }

    return forkJoin({
      civil: this.employeeService.getCivilStatuses().pipe(
        map(resp => {
          try { return JSON.parse(resp).resultado || []; } catch { return []; }
        }),
        catchError(() => of([]))
      ),
      tech: this.employeeService.getAvailableTechnologies().pipe(
        map(resp => {
          try { return JSON.parse(resp).resultado || []; } catch { return []; }
        }),
        catchError(() => of([]))
      ),
      docs: this.employeeService.getTypeDocuments().pipe(
        map(resp => {
          try { return JSON.parse(resp).resultado || []; } catch { return []; }
        }),
        catchError(() => of([]))
      ),
      banks: this.employeeService.getBanks().pipe(
        map(resp => {
          try { return JSON.parse(resp).resultado || []; } catch { return []; }
        }),
        catchError(() => of([]))
      ),
      refs: this.employeeService.getTypeOfReferences().pipe(
        map(resp => {
          try { return JSON.parse(resp).resultado || []; } catch { return []; }
        }),
        catchError(() => of([]))
      ),
      states: this.employeeService.getStates().pipe(
        map(resp => {
          try { return JSON.parse(resp).resultado || []; } catch { return []; }
        }),
        catchError(() => of([]))
      )
    }).pipe(
      tap(result => {
        this.civilStatuses = result.civil;
        this.profiles = result.tech;
        this.requirements = result.docs;
        this.bancos = result.banks;
        this.tipoReferencia = result.refs;
        this.states = result.states;
        this.allStates = Array.isArray(result.states) ? [...result.states] : [];
        this.lookupsLoaded = true;
      }),
      catchError(err => {
        this.toast.error('Error al cargar datos auxiliares', '');
        return of(void 0);
      })
    );
  }

  searchEmployees(){
    this.employeeService.getEmployees({
      fcIdEmpleado: null,
      fcCadena: this.searchText,
      fiIdStatus: null
    }).subscribe({
      next: (response) => {
        try {
          const decrypted = JSON.parse(response);
          this.data = decrypted.resultado || [];
          this.filteredData = [...this.data];
        } catch (e) {
          this.toast.error('Error al procesar los datos de empleados', '');
        }
      },
      error: () => {
        this.toast.error('Error al obtener los datos de empleados', '');
      }
    });
  }

  searchProspects(): void {
    const cadena = { cadena: this.searchText };
    this.employeeService.getProspects(cadena).subscribe({
      next: (response) => {
        try {
          const decrypted = JSON.parse(response);
          this.data = decrypted.resultado || [];
          this.filteredData = [...this.data];
          this.showProspectDropdown = true;
        } catch (e) {
          this.toast.error('Error al procesar los datos de prospectos', '');
        }
      },
      error: () => {
        this.toast.error('Error al obtener los datos de prospectos', '');
      }
    });
  }

  searchEmployeeOrProspect(): void {
    if(this.title === 'Empleados'){
      this.searchEmployees();
    } else {
      this.searchProspects();
    }
  }

  selectProspect(prospect: Employee): void {
    this.showProspectDropdown = false;
    this.loadLookups().subscribe(() => {
      this.newEmployee = true;
      this.title = 'Alta de empleado';
      this.currentStep = 1;
      this.search = false;
      this.viewEmployee = true;
      this.inputsEditables = true;
      this.employeeData = { ...prospect };
      this.employeeData.fdFechaNac = this.formatDateForInput(this.employeeData.fdFechaNac || '');
      this.employeeData.fdFechaAlta = this.formatDateForInput(this.employeeData.fdFechaAlta || '');
      this.selectedCivilStatus = this.civilStatuses.find(cs => cs.fiIdEstadoCivil === (prospect as any).fiIdEstadoCivil)?.fiIdEstadoCivil || '';
      this.selectedProfile = this.profiles.find(p => p.fiIdTecnologia === (prospect as any).fiIdTecnologia)?.fiIdTecnologia || '';
      this.selectedBank = this.bancos.find(b => b.fiIdBanco === (prospect as any).fiIdBanco)?.fiIdBanco || '';
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

  //Descarga el reporte en Excel
  downloadExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Empleados');
    const columnasVisibles = this.columnas.filter(col => col.visible);
    const encabezados = columnasVisibles.map(col => col.label);
    worksheet.addRow(encabezados);
    worksheet.columns = columnasVisibles.map(col => ({
      header: col.label,
      key: col.field,
      width: 20
    }));

    encabezados.forEach((_, idx) => {
      worksheet.getCell(1, idx + 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF017D91' }
      };
      worksheet.getCell(1, idx + 1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    });

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

    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(new Blob([buffer]), 'Empleados.xlsx');
    });
  }

  openNewEmployeeForm(): void {
    this.loadLookups().subscribe(() => {
      this.newEmployee = true;
      this.title = 'Alta de empleado';
      this.currentStep = 1;
      this.inputsEditables = true;
    });
  }

  closeEmployeeForm(): void {
    this.newEmployee = false;
    this.currentStep = 1;
    this.title = 'Empleados';
    this.search = true;
    this.searchText = '';
    this.inputsEditables = false;
    this.viewEmployee = false;
    this.employeeData = {};
    this.selectedCivilStatus = '';
    this.selectedProfile = '';
    this.selectedBank = '';
    this.selectedReference1Type = '';
    this.selectedReference2Type = '';
    this.selectedReference3Type = '';
    this.uploadedFiles = [];
    this.fileCounter = 0;
    this.filteredData = [];
    this.data = [];
    this.addressLoaded = false;
    this.employeeAddress = {
      fiIdDoEmpleado: 0,
      fiIdEmpleado: '',
      fcCalle: '',
      fcNumInt: null,
      fcNumExt: null,
      fiIdEstado: null,
      fcEstado: null,
      fiIdMunicipio: null,
      fcMunicipio: null,
      fiIdColonia: null,
      fcColonia: null,
      fiCp: null,
      fiIdPais: null
    };
  }

  goToStep(step: number): void {
    this.currentStep = step;
    if (step > 1 || this.viewEmployee) {
      this.search = false;
    } else {
      this.search = true;
    }
  }

  onCuentaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const sanitized = (input.value || '').replace(/\D/g, '').slice(0, 18);
    this.employeeData = this.employeeData || ({} as any);
    this.employeeData.fcCuenta = sanitized;
    input.value = sanitized;
  }

  onCpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const sanitized = (input.value || '').replace(/\D/g, '').slice(0, 5);
    this.employeeAddress = this.employeeAddress || ({} as any);
    this.employeeAddress.fiCp = sanitized || null;
    input.value = sanitized;
    if (sanitized.length === 5) {
      this.getColoniesByZipCode();
    } else {
      this.colonieZipCode = true;
      this.colonies = [];
      this.municipalities = [];
      this.employeeAddress.fiIdEstado = null;
      this.employeeAddress.fiIdMunicipio = null;
      this.employeeAddress.fiIdColonia = null;
      if (Array.isArray(this.allStates) && this.allStates.length > 0) {
        this.states = [...this.allStates];
      }
    }
  }

  getColoniesByZipCode(): void {
    if (!this.employeeAddress.fiCp) {
      this.colonies = [];
      this.municipalities = [];
      if (Array.isArray(this.allStates) && this.allStates.length > 0) {
        this.states = [...this.allStates];
      }
      return;
    }

    this.employeeService.getColoniesByZipCode({ fiCp: this.employeeAddress.fiCp }).subscribe({
      next: (response: string) => {
        try {
          const decrypted = JSON.parse(response);
          const resultado = decrypted.resultado;
          if (!resultado) {
            this.colonies = [];
            return;
          }
          if (typeof resultado === 'object' && !Array.isArray(resultado)) {
            if (resultado.estados && resultado.estados.length > 0) {
              this.states = resultado.estados;
            } else if (Array.isArray(this.allStates) && this.allStates.length > 0) {
              this.states = [...this.allStates];
            }
            this.municipalities = resultado.municipios || [];
            this.colonies = resultado.colonias || [];
            if (this.states.length === 1) {
              const stateId = Number(this.states[0].fiIdEstado);
              if (this.employeeAddress.fiIdEstado !== stateId) {
                this.employeeAddress.fiIdEstado = stateId;
                this.employeeAddress.fcEstado = this.states[0].fcEstado;
              }
            }
            if (this.municipalities.length === 1) {
              const muniId = Number(this.municipalities[0].fiIdMunicipio);
              if (this.employeeAddress.fiIdMunicipio !== muniId) {
                this.employeeAddress.fiIdMunicipio = muniId;
                this.employeeAddress.fcMunicipio = this.municipalities[0].fcMunicipio;
              }
            }
            if (this.colonies.length === 1) {
              const colId = Number(this.colonies[0].fiIdColonia);
              if (this.employeeAddress.fiIdColonia !== colId) {
                this.employeeAddress.fiIdColonia = colId;
                this.employeeAddress.fcColonia = this.colonies[0].fcColonia;
              }
            }else if (this.colonies.length > 1){
              this.colonieZipCode = false;
            }
            
          } else {
            this.colonies = Array.isArray(resultado) ? resultado : [];
          }
          this.cdr.detectChanges();
        } catch (e) {
          this.toast.error('Error al procesar las colonias por código postal', '');
        }
      },
      error: () => {
        this.toast.error('Error al obtener las colonias por código postal', '');
      }
    });
  }

  saveGeneralInfo(): void {
    const isNewEmployee = this.title === 'Alta de empleado';
    const missing: string[] = [];
    if (!this.employeeData?.fcNombre || !String(this.employeeData.fcNombre).trim()) missing.push('Nombre(s)');
    if (!this.employeeData?.fcPaterno || !String(this.employeeData.fcPaterno).trim()) missing.push('Apellido paterno');
    if (!this.employeeData?.fcMaterno || !String(this.employeeData.fcMaterno).trim()) missing.push('Apellido materno');
    if (!this.employeeData?.fiIdEmpleado || !String(this.employeeData.fiIdEmpleado).trim()) missing.push('RFC (identificador)');
    if (!this.employeeData?.fcNumero || !String(this.employeeData.fcNumero).trim()) missing.push('Celular');
    if (!this.employeeData?.fcMail || !String(this.employeeData.fcMail).trim()) missing.push('Correo electrónico');
    if (missing.length) {
      const lista = missing.join(', ');
      this.toast.error(`Faltan datos obligatorios: ${lista}`, '');
      return;
    }
    if (isNewEmployee) {
      const payload = {
        fiIdEmpleado: this.employeeData.fiIdEmpleado || '',
        fiIdProspecto: this.employeeData.fiIdProspecto ?? null,
        fcNombre: this.employeeData.fcNombre || '',
        fcPaterno: this.employeeData.fcPaterno || '',
        fcMaterno: this.employeeData.fcMaterno || '',
        fdFechaNac: this.toApiFecha(this.employeeData.fdFechaNac as string) || null,
        fcMail: this.employeeData.fcMail || '',
        fcNumero: this.employeeData.fcNumero || '',
        fcCurp: this.employeeData.fcCurp || '',
        fcNss: this.employeeData.fcNss ?? null,
        fiIdEstadoCivil: this.selectedCivilStatus ? Number(this.selectedCivilStatus) : (this.employeeData.fiIdEstadoCivil != null ? Number(this.employeeData.fiIdEstadoCivil) : null),
        fiIdTecnologia: this.selectedProfile ? Number(this.selectedProfile) : (this.employeeData.fiIdTecnologia != null ? Number(this.employeeData.fiIdTecnologia) : null),
        fiValidacion: 1
      };
      this.employeeService.fromProspectToEmployee(payload).subscribe({
        next: (response: string) => {
          try {
            const json = JSON.parse(response);
            if (json.estatus === 'OK') {
              const mensaje = json.mensaje || 'Empleado creado correctamente';
              this.toast.success(mensaje, '');
            } else {
              const mensaje = json.mensaje || 'Error al crear el empleado';
              this.toast.error(mensaje, '');
              if (Array.isArray(json.resultado) && json.resultado.length) {
                if(json.resultado[0].fiIdStatus === 0){
                  this.btnUpdateEmployeeExistents = false;
                  this.btnActivateEmployeeExistents = true;
                } else if(json.resultado[0].fiIdStatus === 2){
                  this.btnUpdateEmployeeExistents = false;
                  this.btnActivateEmployeeExistents = false;
                }else if(json.resultado[0].fiIdStatus === 1){
                  this.btnUpdateEmployeeExistents = true;
                  this.btnActivateEmployeeExistents = false;
                }
                this.homonimias = json.resultado;
                this.showHomonimiasModal = true;
                this.cdr.detectChanges();
              }
            }
          } catch (e) {
            this.toast.error('Respuesta inválida del servidor', '');
          }
        },
        error: () => {
          this.toast.error('Error al insertar el empleado', '');
        }
      });
      return;
    }

    const payload = {
      fiIdEmpleado: this.employeeData.fiIdEmpleado || '',
      fiIdProspecto: this.employeeData.fiIdProspecto ?? null,
      fcNombre: this.employeeData.fcNombre || '',
      fcPaterno: this.employeeData.fcPaterno || '',
      fcMaterno: this.employeeData.fcMaterno || '',
      fdFechaNac: this.toApiFecha(this.employeeData.fdFechaNac as string) || null,
      fcCuentaClabe: this.employeeData.fcCuenta || '',
      fdFechaAlta: this.toApiFecha(this.employeeData.fdFechaAlta as string) || null,
      fcNss: this.employeeData.fcNss || '',
      fiIdBanco: this.selectedBank ? Number(this.selectedBank) : (this.employeeData.fiIdBanco != null ? Number(this.employeeData.fiIdBanco) : null),
      fiSalario: this.employeeData.fiSalario != null ? Number(this.employeeData.fiSalario ?? this.employeeData.fiSalario) : null,
      fiCelular: this.employeeData.fcNumero ?? '',
      fcMail: this.employeeData.fcMail || '',
      fcCurp: this.employeeData.fcCurp || '',
      fiIdEstadoCivil: this.selectedCivilStatus ? Number(this.selectedCivilStatus) : (this.employeeData.fiIdEstadoCivil != null ? Number(this.employeeData.fiIdEstadoCivil) : null),
      fiNumeroCuenta: this.employeeData.fiNumeroCuenta ?? null,
      fiIdTecnologia: this.selectedProfile ? Number(this.selectedProfile) : (this.employeeData.fiIdTecnologia != null ? Number(this.employeeData.fiIdTecnologia) : null)
    };

    this.employeeService.updateEmployee(payload).subscribe({
      next: (response: string) => {
        try {
          const json = JSON.parse(response);
          const mensaje = json.mensaje || 'Empleado guardado correctamente';
          this.toast.success(mensaje, '');
        } catch (e) {
          this.toast.error('Error al procesar la respuesta del servidor', '');
        }
      },
      error: () => {
        this.toast.error('Error al guardar el empleado', '');
      }
    });
  }

  saveAddress(): void {
    const addressPayload = {
      fiIdPais: String(this.employeeAddress.fiIdPais ?? ''),
      fiIdEmpleado: String(this.employeeData.fiIdEmpleado ?? ''),
      fcNumExt: this.employeeAddress.fcNumExt != null ? String(this.employeeAddress.fcNumExt) : '',
      fiIdDomEmpl: this.employeeAddress.fiIdDoEmpleado ?? null,
      fiIdEstado: this.employeeAddress.fiIdEstado ?? null,
      fcEstado: this.employeeAddress.fcEstado || '',
      fcMunicipio: this.employeeAddress.fcMunicipio ?? null,
      fiIdMunicipio: this.employeeAddress.fiIdMunicipio ?? null,
      fcNumInt: this.employeeAddress.fcNumInt != null ? String(this.employeeAddress.fcNumInt) : '',
      fiCp: this.employeeAddress.fiCp != null ? String(this.employeeAddress.fiCp) : '',
      fcCalle: this.employeeAddress.fcCalle || '',
      fiIdColonia: this.employeeAddress.fiIdColonia ?? null
    };

    this.employeeService.updateEmployeeAddress(addressPayload).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const mensaje = json.mensaje || 'Domicilio guardado correctamente';
        this.toast.success(mensaje, '');
      },
      error: () => {
        this.toast.error('Error al guardar el domicilio del empleado', '');
      }
    });
  }

  saveLaboralInfo(): void {
    const payload = {
      fiIdEmpleado: this.employeeData.fiIdEmpleado || '',
      fdFechaAlta: this.toApiFecha(this.employeeData.fdFechaAlta as string) || null,
      fiIdBanco: this.selectedBank ? Number(this.selectedBank) : (this.employeeData.fiIdBanco != null ? Number(this.employeeData.fiIdBanco) : null),
      fiSalario: this.employeeData.fiSalario != null ? Number(this.employeeData.fiSalario ?? this.employeeData.fiSalario) : null,
      fcCuentaClabe: this.employeeData.fcCuenta || '',
      fiNumeroCuenta: this.employeeData.fiNumeroCuenta ?? null
    };
    this.employeeService.updateLaboralDates({...payload}).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const mensaje = json.mensaje || 'Información laboral guardada correctamente';
        this.toast.success(mensaje, '');
      },
      error: () => {
        this.toast.error('Error al guardar la información laboral del empleado', '');
      }
    });
  }

  saveDocuments(): void {
    const assigned = this.requirements.filter(r => (r as any).assignedFile && !(r as any).existingDocument);
    if (!assigned.length) {
      this.toast.error('No hay documentos nuevos para guardar', '');
      return;
    }
    const fileToBase64 = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const b64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(b64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

    Promise.all(
      assigned.map(async (req) => {
        const file = (req as any).assignedFile as File;
        const b64 = await fileToBase64(file);
        return {
          fiIdEmpleado: String(this.employeeData.fiIdEmpleado ?? ''),
          fiIdTipoDoc: Number((req as any).fiIdTipoDocumento),
          fcNombre: file.name,
          fcTipo: file.type || 'application/octet-stream',
          fcDocumento: b64
        };
      })
    )
      .then((payloads) => {
        console.log('payloads new docs', payloads);
        const requests = payloads.map(p =>
          this.employeeService.insertDocumentEmployee(p).pipe(
            catchError(err => {
              return of(null);
            })
          )
        );

        forkJoin(requests).subscribe((results) => {
          const ok = (results || []).filter(r => r != null).length;
          if (ok === payloads.length) {
            this.toast.success('Documentos guardados correctamente', '');
          } else if (ok > 0) {
            this.toast.error('Algunos documentos no se guardaron', '');
          } else {
            this.toast.error('Error al guardar los documentos', '');
          }
          this.searchEmployees();
        });
      })
      .catch((err) => {
        this.toast.error('Error al procesar los archivos', '');
      });
  }

  saveReferences(): void {
    if (!this.employeeData?.fiIdEmpleado) {
      this.toast.error('No hay empleado seleccionado para guardar referencias', '');
      return;
    }
    const payloads = (this.references || [])
      .map(r => {
        const nombre = (r.fcNombre || '').trim();
        const telefonoRaw = (r.fiTelefono || '').toString();
        const telefonoNum = telefonoRaw ? Number(telefonoRaw.replace(/\D/g, '')) : null;
        return {
          fiIdReferencia: r.fiIdReferencia ?? null,
          fiIdTipoReferencia: r.fiIdTipoReferencia != null ? Number(r.fiIdTipoReferencia) : null,
          fiTelefono: telefonoNum,
          fcIdEmpleado: String(this.employeeData.fiIdEmpleado),
          fcNombre: nombre
        };
      })
      .filter(p => p.fcNombre || p.fiTelefono != null || p.fiIdTipoReferencia != null);
    if (!payloads.length) {
      this.toast.error('No hay referencias para guardar', '');
      return;
    }
    const requests = payloads.map(p =>
      this.employeeService.insertReference(p).pipe(
        map(resp => {
          try { return JSON.parse(resp); } catch { return null; }
        }),
        catchError(err => {
          return of(null);
        })
      )
    );
    forkJoin(requests).subscribe(results => {
      const successCount = (results || []).filter(r => r && r.estatus === 'OK').length;
      if (successCount === payloads.length) {
        this.toast.success('Referencias guardadas correctamente', '');
      } else if (successCount > 0) {
        this.toast.error('Algunas referencias se guardaron, revisa posibles errores', '');
      } else {
        this.toast.error('Error al guardar las referencias', '');
      }
      this.reloadReferences();
    }, err => {
      this.toast.error('Error al guardar las referencias', '');
    });
  }
  private reloadReferences(): void {
    if (!this.employeeData?.fiIdEmpleado) return;
    this.employeeService.getReferencesByEmployeeId({ fiIdEmpleado: this.employeeData.fiIdEmpleado }).subscribe({
      next: (response) => {
        try {
          const decrypted = JSON.parse(response);
          const refs = (decrypted.resultado || []) as any[];
         this.references = refs.map(r => ({
            fiIdReferencia: r.fiIdReferencia ?? null,
            fiIdTipoReferencia: r.fiIdTipoReferencia != null ? Number(r.fiIdTipoReferencia) : null,
            fiTelefono: r.fiTelefono ?? '',
            fcIdEmpleado: r.fcIdEmpleado ?? String(this.employeeData.fiIdEmpleado),
            fcNombre: r.fcNombre ?? ''
          }));
          for (let i = this.references.length; i < 3; i++) {
            this.references.push({
              fiIdReferencia: 1001 + i,
              fiIdTipoReferencia: null,
              fiTelefono: '',
              fcIdEmpleado: String(this.employeeData.fiIdEmpleado),
              fcNombre: ''
            });
          }
          this.cdr.detectChanges();
        } catch (e) {
          this.toast.error('Error al procesar las referencias del empleado', '');
        }
      },
      error: () => {
        this.toast.error('Error al obtener las referencias del empleado', '');
      }
    });
  }

  // --- Manejadores de Drag & Drop ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    if (files) {
      this.addFiles(files);
    }
    element.value = '';
  }

  private addFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!this.uploadedFiles.some(f => f.file.name === file.name && f.file.size === file.size)) {
        this.uploadedFiles.push({ file: file, id: this.fileCounter++, existing: false } as any);
      }
    }
    this.cdr.detectChanges();
  }

  removeFile(fileId: number) {
    const uploadedEntry = this.uploadedFiles.find(f => f.id === fileId);
    if (!uploadedEntry) return;
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
    const req = this.requirements.find(r => (r as any).assignedFile?.name === uploadedEntry.file.name);
    if (req) {
      (req as any).assignedFile = null;
      (req as any).existingDocument = false;
    }
    this.cdr.detectChanges();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(files);
    }
  }

  assignCategory(fileId: number, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const categoryIdRaw = selectElement.value;
    const categoryId = Number(categoryIdRaw);
    if (!categoryIdRaw || isNaN(categoryId)) return;
    const uploadedEntry = this.uploadedFiles.find(f => f.id === fileId);
    if (!uploadedEntry) return;
    const fileToAssign = uploadedEntry.file;
    this.requirements.forEach(req => {
      if ((req as any).assignedFile?.name === fileToAssign.name) {
        (req as any).assignedFile = null;
        (req as any).existingDocument = false;
      }
    });

    // Busca el requisito destino (comparación numérica con fiIdTipoDocumento)
    const targetRequirement = this.requirements.find(r => Number(r.fiIdTipoDocumento) === categoryId);
    if (!targetRequirement) return;

    // Si el requisito ya tenía un archivo, lo devolvemos a uploadedFiles (opcional)
    if ((targetRequirement as any).assignedFile) {
      const existing = (targetRequirement as any).assignedFile as File;
      if (!this.uploadedFiles.some(u => u.file.name === existing.name && u.file.size === existing.size)) {
        this.uploadedFiles.push({ file: existing, id: this.fileCounter++, existing: !!(targetRequirement as any).existingDocument } as any);
      }
    }

    // Asigna el nuevo archivo al requisito
    (targetRequirement as any).assignedFile = fileToAssign;
    (targetRequirement as any).existingDocument = !!(uploadedEntry as any).existing;

    // Quita el archivo asignado de la lista "pendiente de asignar"
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
    this.cdr.detectChanges();
  }

  formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Helper para saber qué opciones deshabilitar en el dropdown
  isCategoryAssigned(categoryId: number | string): boolean {
    const id = typeof categoryId === 'number' ? categoryId : Number(categoryId);
    if (isNaN(id)) return false;
    return this.requirements.some(r => Number(r.fiIdTipoDocumento) === id && (r as any).assignedFile != null);
  }

  get assignedFiles(): UploadedFile[] {
    return this.requirements
      .filter(req => (req as any).assignedFile != null)
      .map(req => {
        return {
          file: (req as any).assignedFile!,
          id: -1
        } as UploadedFile;
      });
  }

  getAssignedRequirementName(file: UploadedFile): string {
    const req = this.requirements.find(r =>
      (r as any).assignedFile && (r as any).assignedFile.name === file.file.name
    );
    return req ? (req as any).fcNombre : '';
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

  viewInfoEmployee(employee: Employee): void {
    this.loadLookups().subscribe(() => {
      this.newEmployee = true;
      this.title = 'Información del empleado';
      this.currentStep = 1;
      this.search = false;
      this.viewEmployee = true;
      this.employeeData = { ...employee};
      this.employeeData.fdFechaNac = this.formatDateForInput(this.employeeData.fdFechaNac || '');
      this.employeeData.fdFechaAlta = this.formatDateForInput(this.employeeData.fdFechaAlta || '');
      this.selectedCivilStatus = this.civilStatuses.find(cs => cs.fiIdEstadoCivil === employee.fiIdEstadoCivil)?.fiIdEstadoCivil || '';
      this.selectedProfile = this.profiles.find(p => p.fiIdTecnologia === employee.fiIdTecnologia)?.fiIdTecnologia || '';
      this.selectedBank = this.bancos.find(b => b.fiIdBanco === employee.fiIdBanco)?.fiIdBanco || '';
      this.employeeService.getAddressByEmployeeId({ fiIdEmpleado: employee.fiIdEmpleado }).subscribe({
        next: (response) => {
          try {
            const decrypted = JSON.parse(response);
            const addr = decrypted.resultado[0] || null;
            if (addr) {
              addr.fiIdEstado = addr.fiIdEstado != null ? Number(addr.fiIdEstado) : null;
              addr.fiIdMunicipio = addr.fiIdMunicipio != null ? Number(addr.fiIdMunicipio) : null;
              addr.fiIdColonia = addr.fiIdColonia != null ? Number(addr.fiIdColonia) : null;
              addr.fiIdPais = addr.fiIdPais != null ? Number(addr.fiIdPais) : 1;
              addr.fiCp = addr.fiCp != null ? String(addr.fiCp).padStart(5, '0') : null;
              this.employeeAddress = { ...this.employeeAddress, ...addr };

              if (this.employeeAddress.fiCp && String(this.employeeAddress.fiCp).length === 5) {
                this.getColoniesByZipCode();
              } else {
                this.addCurrentAddressOptionsToLists();
              }
              this.addressLoaded = true;
              this.cdr.detectChanges();
            }
          } catch (e) {
            this.toast.error('Error al procesar los datos de domicilio del empleado', '');
          }
        },
        error: () => {
          this.toast.error('Error al obtener los datos de domicilio del empleado', '');
        }
      });

      this.employeeService.getDocumentsEmployee({ fiIdEmpleado: employee.fiIdEmpleado }).subscribe({
        next: (response) => {
          try {
            const decrypted = JSON.parse(response);
            const uploadedFiles: UploadedFile[] = [];
            const documentos = decrypted.resultado || [];
            const base64ToBlob = (b64: string, contentType = 'application/octet-stream') => {
              const payload = b64?.includes(',') ? b64.split(',')[1] : b64 || '';
              const binary = atob(payload || '');
              const len = binary.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              return new Blob([bytes], { type: contentType });
            };
            documentos.forEach((doc: any) => {
              if (!doc) return;
              if (!doc.fcDocumento) return;
              const mime = doc.fcTipo || 'application/octet-stream';
              const name = doc.fcNombre || `document_${doc.fiIdTipoDocumento || 'unknown'}`;
              const blob = base64ToBlob(doc.fcDocumento, mime);
              const file = new File([blob], name, { type: mime });
              const req = this.requirements.find(r => Number(r.fiIdTipoDocumento) === Number(doc.fiIdTipoDocumento));
              if (req) {
                if (!(req as any).assignedFile) {
                  (req as any).assignedFile = file;
                  (req as any).existingDocument = true;
                } else {
                  this.uploadedFiles.push({ file, id: this.fileCounter++, existing: true } as any);
                }
              } else {
                this.uploadedFiles.push({ file, id: this.fileCounter++, existing: true } as any);
              }
            });
            this.uploadedFiles = [...this.uploadedFiles, ...uploadedFiles];
          } catch (e) {
            this.toast.error('Error al procesar los documentos del empleado', '');
          }
        },
        error: () => {
          this.toast.error('Error al obtener los documentos del empleado', '');
        }
      });

      this.employeeService.getReferencesByEmployeeId({ fiIdEmpleado: employee.fiIdEmpleado }).subscribe({
        next: (response) => {
          try {
            const decrypted = JSON.parse(response);
            const refs = (decrypted.resultado || []) as any[];
            this.references = refs.map((r) => ({
              fiIdReferencia: r.fiIdReferencia ?? null,
              fiIdTipoReferencia: r.fiIdTipoReferencia != null ? Number(r.fiIdTipoReferencia) : null,
              fiTelefono: r.fiTelefono ?? '',
              fcIdEmpleado: r.fcIdEmpleado ?? '',
              fcNombre: r.fcNombre ?? ''
            }));
            for (let i = this.references.length; i < 3; i++) {
              this.references.push({
                fiIdReferencia: 1001 + i,
                fiIdTipoReferencia: null,
                fiTelefono: '',
                fcIdEmpleado: employee.fiIdEmpleado,
                fcNombre: ''
              });
            }
          } catch (e) {
            this.toast.error('Error al procesar las referencias del empleado', '');
          }
        },
        error: () => {
          this.toast.error('Error al obtener las referencias del empleado', '');
        }
      });
    });
  }

  openBajaEmployee(): void {
    this.showBajaEmployeeModal = true;
  }

  closeBajaEmployee(): void {
    this.showBajaEmployeeModal = false;
    this.bajaReason = '';
  }

  confirmBajaEmployee(): void {
    const payload = {
      fiIdEmpleado: this.employeeData.fiIdEmpleado,
      fdFechaBaja: (() => {
          const d = new Date();
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        })(),
      fcMotivoBaja: this.bajaReason
    };
    if (!payload.fcMotivoBaja || payload.fcMotivoBaja.trim().length === 0) {
      this.toast.error('Debe proporcionar un motivo de baja', '');
      return;
    }
    this.employeeService.deleteEmployee(payload).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const mensaje = json.mensaje || 'Empleado dado de baja correctamente';
        this.toast.success(mensaje, '');
        this.closeBajaEmployee();
        this.searchEmployees();
      }
      ,error: () => {
        this.toast.error('Error al dar de baja al empleado', '');
      }
    });
    this.showBajaEmployeeModal = false;
    this.bajaReason = '';
  }

  openVetarEmployee(): void {
    this.showVetaEmployeeModal = true;
  }

  closeVetarEmployee(): void {
    this.showVetaEmployeeModal = false;
    this.vetarReason = '';
  }

  confirmVetarEmployee(): void {
    const payload = {
      fiIdEmpleado: this.employeeData.fiIdEmpleado,
      fdFechaBaja: (() => {
          const d = new Date();
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        })(),
      fcMotivoBaja: this.vetarReason
    };
    if (!payload.fcMotivoBaja || payload.fcMotivoBaja.trim().length === 0) {
      this.toast.error('Debe proporcionar un motivo para vetar al empleado', '');
      return;
    }
    this.employeeService.vetarEmployee(payload).subscribe({
      next: (response: string) => {
        const json = JSON.parse(response);
        const mensaje = json.mensaje || 'Empleado vetado correctamente';
        this.toast.success(mensaje, '');
        this.closeVetarEmployee();
        this.searchEmployees();
      }
      ,error: () => {
        this.toast.error('Error al vetar al empleado', '');
      }
    });
    this.showVetaEmployeeModal = false;
    this.vetarReason = '';
  }

  verArchivo(file: UploadedFile): void {
    const fileURL = URL.createObjectURL(file.file);
    window.open(fileURL, '_blank');
  }

  quitarArchivoAsignado(file: UploadedFile): void {
    const req = this.requirements.find(r => (r as any).assignedFile?.name === file.file.name);
    if (req) {
      (req as any).assignedFile = null;
    }
    this.uploadedFiles.push({ file: file.file, id: this.fileCounter++ });
  }

  onFileInputClick() {
    this.fileInputRef?.nativeElement?.click();
  }

  openMaps(): void {
    this.gmapsLoader.load(enviroment.googleMapsApiKey).then(() => {
      this.googleMapsLoaded = true;
      this.showMapsModal = true;
      setTimeout(() => this.cdr.detectChanges(), 50);
    }).catch(() => {
      this.toast.error('No se pudo cargar la API de Google Maps', '');
    });
  }

  closeMapsModal(): void {
    this.showMapsModal = false;
  }

  onMapClick(event: any) {
    const lat = event?.latLng?.lat ? event.latLng.lat() : null;
    const lng = event?.latLng?.lng ? event.latLng.lng() : null;
    if (lat != null && lng != null) {
      this.markerPosition = { lat, lng };
      this.center = { lat, lng };
      this.cdr.detectChanges();
    }
  }

  confirmLocation(): void {
    if (!this.markerPosition) { this.toast.error('Selecciona una ubicación', ''); return; }
    const { lat, lng } = this.markerPosition;
    const googleNs = (window as any).google;
    if (googleNs && googleNs.maps && googleNs.maps.Geocoder) {
      const geocoder = new googleNs.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === 'OK' && results?.length) {
          const best = results.find(r => r.types?.includes('street_address')) || results[0];
          const comp = (type: string) => (best.address_components || []).find((c: any) => c.types?.includes(type))?.long_name;
          const parsed = {
            street: comp('route'), streetNumber: comp('street_number'), postalCode: comp('postal_code')
          };
          this.applyParsedAddress(parsed);
          const postal = (parsed.postalCode || '').toString().replace(/\D/g, '').slice(0, 5);
          if (postal.length === 5) {
            this.employeeAddress.fiCp = postal;
            this.getColoniesByZipCode();
          }
          this.toast.success('Dirección recuperada (cliente)', '');
        } else {
          this.toast.error('No se encontró dirección con el geocoder cliente', '');
        }
      });
      this.showMapsModal = false;
      return;
    }
  }

  private applyParsedAddress(parsed: any) {
    this.employeeAddress.fcCalle = parsed.street || this.employeeAddress.fcCalle;
    this.employeeAddress.fcNumExt = parsed.streetNumber || this.employeeAddress.fcNumExt;
    this.employeeAddress.fiCp = parsed.postalCode || this.employeeAddress.fiCp;
    this.cdr.detectChanges();
  }

  selectState(eventOrValue: Event | number): void {
    const stateId = Number(eventOrValue);
    if (isNaN(stateId)) {
      this.employeeAddress.fiIdEstado = null;
      this.employeeAddress.fcEstado = '';
      this.municipalities = [];
      this.employeeAddress.fiIdMunicipio = null;
      return;
    }
    this.employeeAddress.fiIdEstado = stateId;
    this.employeeAddress.fcEstado = this.states.find(s => s.fiIdEstado === stateId)?.fcEstado || '';
    this.employeeAddress.fiIdMunicipio = null;
    this.municipalities = [];
    this.employeeService.getMunicipalities({ fiIdEstado: stateId }).subscribe({
       next: (response) => {
         try {
           const decrypted = JSON.parse(response);
           this.municipalities = decrypted.resultado || [];
         }
         catch (e) {
           this.toast.error('Error al procesar los datos de municipios', '');
         }
       },
       error: () => {
         this.toast.error('Error al obtener los datos de municipios', '');
       }
    });
  }

  selectMunicipality(eventOrValue: Event | number): void {
    const muniId = Number(eventOrValue);
    if (isNaN(muniId)) {
      this.employeeAddress.fiIdMunicipio = null;
      this.employeeAddress.fcMunicipio = '';
      this.colonies = [];
      this.employeeAddress.fiIdColonia = null;
      return;
    }
    this.employeeAddress.fiIdMunicipio = muniId;
    this.employeeAddress.fcMunicipio = this.municipalities.find(m => m.fiIdMunicipio === muniId)?.fcMunicipio || '';
    this.employeeAddress.fiIdColonia = null;
    this.colonies = [];
    this.employeeService.getColonies({ fiIdEstado: this.employeeAddress.fiIdEstado, fiIdMunicipio: muniId }).subscribe({
      next: (response) => {
        try {
          const decrypted = JSON.parse(response);
          this.colonies = decrypted.resultado || [];
          this.colonieZipCode = true;
        }
        catch (e) {
          this.toast.error('Error al procesar los datos de colonias', '');
        }
      },
      error: () => {
        this.toast.error('Error al obtener los datos de colonias', '');
      }
    });
  }

  selectColony(eventOrValue: Event | string | number): void {
      let valueStr = '';
      if (eventOrValue instanceof Event) {
        const target = eventOrValue.target as HTMLSelectElement | null;
        valueStr = target?.value ?? '';
      } else {
        valueStr = String(eventOrValue ?? '');
      }
      const colId = Number(valueStr);
      if (isNaN(colId)) {
        this.employeeAddress.fiCp = null;
        this.employeeAddress.fiIdColonia = null;
        this.employeeAddress.fcColonia = '';
        return;
      }
      if (this.colonieZipCode){
        this.employeeAddress.fiIdColonia = colId;
        const found = (this.colonies || []).find(c => Number(c.fiIdColonia) === colId);
        if (found) {
          this.employeeAddress.fcColonia = found.fcColonia || '';
          this.employeeAddress.fiCp = found.fiCodigoPostal != null ? String(found.fiCodigoPostal).padStart(5, '0') : null;
        } else {
          this.employeeAddress.fcColonia = '';
          this.employeeAddress.fiCp = null;
        }
      }
      this.cdr.detectChanges();
    }

  private addCurrentAddressOptionsToLists(): void {
    if (this.employeeAddress.fiIdEstado != null && !this.states.some(s => s.fiIdEstado === this.employeeAddress.fiIdEstado)) {
      this.states = [{ fiIdEstado: this.employeeAddress.fiIdEstado, fcEstado: this.employeeAddress.fcEstado || '' }, ...this.states];
    }
    if (this.employeeAddress.fiIdMunicipio != null && !this.municipalities.some(m => m.fiIdMunicipio === this.employeeAddress.fiIdMunicipio)) {
      this.municipalities = [{ fiIdMunicipio: this.employeeAddress.fiIdMunicipio, fcMunicipio: this.employeeAddress.fcMunicipio || '' }, ...this.municipalities];
    }
    if (this.employeeAddress.fiIdColonia != null && !this.colonies.some(c => c.fiIdColonia === this.employeeAddress.fiIdColonia)) {
      this.colonies = [{
        fiIdColonia: this.employeeAddress.fiIdColonia,
        fcColonia: this.employeeAddress.fcColonia || '',
        fiCodigoPostal: this.employeeAddress.fiCp || ''
      }, ...this.colonies];
    }
    this.cdr.detectChanges();
  }

  openHomonimiasModal(): void {
    this.showHomonimiasModal = true;
  }

  closeHomonimiasModal(): void {
    this.showHomonimiasModal = false;
    this.homonimias = [];
  }

  updateExistingFromNew(existing: any): void {
    if (!existing || !existing.fiIdEmpleado) {
      this.toast.error('Empleado existente inválido', '');
      return;
    }
    const payload = {
      fiIdEmpleado: existing.fiIdEmpleado,
      fiIdProspecto: this.employeeData.fiIdProspecto ?? null,
      fcNombre: this.employeeData.fcNombre || existing.fcNombre || '',
      fcPaterno: this.employeeData.fcPaterno || existing.fcPaterno || '',
      fcMaterno: this.employeeData.fcMaterno || existing.fcMaterno || '',
      fdFechaNac: this.toApiFecha(this.employeeData.fdFechaNac as string) || (existing.fdFechaNac ? existing.fdFechaNac : ''),
      fcMail: this.employeeData.fcMail || existing.fcMail || '',
      fcNumero: this.employeeData.fcNumero || existing.fcNumero || '',
      fcCurp: this.employeeData.fcCurp || existing.fcCurp || '',
      fcNss: this.employeeData.fcNss ?? existing.fcNss ?? null,
      fiIdEstadoCivil: this.selectedCivilStatus ? Number(this.selectedCivilStatus) : (existing.fiIdEstadoCivil != null ? Number(existing.fiIdEstadoCivil) : null),
      fiIdTecnologia: this.selectedProfile ? Number(this.selectedProfile) : (existing.fiIdTecnologia != null ? Number(existing.fiIdTecnologia) : null),
      fiValidacion: 2
    };
    this.employeeService.fromProspectToEmployee(payload).subscribe({
      next: (response: string) => {
        try {
          const json = JSON.parse(response);
          const mensaje = json.mensaje || 'Empleado existente actualizado correctamente';
          this.toast.success(mensaje, '');
          this.closeHomonimiasModal();
        } catch (e) {
          this.toast.error('Error al procesar la respuesta del servidor', '');
        }
      },
      error: () => {
        this.toast.error('Error al actualizar el empleado existente', '');
      }
    });
  }

  reactivateEmployee(existing: any): void {
    if (!existing || !existing.fiIdEmpleado) {
      this.toast.error('Empleado inválido para reactivar', '');
      return;
    }
    const payload = {
      fiIdEmpleado: String(existing.fiIdEmpleado),
      fiIdProspecto: this.employeeData?.fiIdProspecto ?? null,
      fcNombre: this.employeeData?.fcNombre ?? null,
      fcPaterno: this.employeeData?.fcPaterno ?? null,
      fcMaterno: this.employeeData?.fcMaterno ?? null,
      fdFechaNac: this.employeeData?.fdFechaNac ? this.toApiFecha(this.employeeData.fdFechaNac as string) : null,
      fcCuentaClabe: this.employeeData?.fcCuenta ?? null,
      fdFechaAlta: this.employeeData?.fdFechaAlta ? this.toApiFecha(this.employeeData.fdFechaAlta as string) : null,
      fcNss: this.employeeData?.fcNss ?? null,
      fiIdBanco: this.selectedBank ? Number(this.selectedBank) : (this.employeeData?.fiIdBanco != null ? Number(this.employeeData.fiIdBanco) : null),
      fiSalario: this.employeeData?.fiSalario != null ? Number(this.employeeData.fiSalario) : null,
      fiCelular: this.employeeData?.fcNumero ? String(this.employeeData.fcNumero) : null,
      fcMail: this.employeeData?.fcMail ?? null,
      fcCurp: this.employeeData?.fcCurp ?? null,
      fiIdEstadoCivil: this.selectedCivilStatus ? Number(this.selectedCivilStatus) : (this.employeeData?.fiIdEstadoCivil != null ? Number(this.employeeData.fiIdEstadoCivil) : null),
      fiNumeroCuenta: this.employeeData?.fiNumeroCuenta != null ? Number(this.employeeData.fiNumeroCuenta) : null,
      fiIdTecnologia: this.selectedProfile ? Number(this.selectedProfile) : (this.employeeData?.fiIdTecnologia != null ? Number(this.employeeData.fiIdTecnologia) : null)
    };
    this.employeeService.reactivateEmployee(payload).subscribe({
      next: (response: string) => {
        try {
          const json = JSON.parse(response);
          if (json.estatus === 'OK') {
            this.toast.success(json.mensaje || 'Empleado reactivado correctamente', '');
            this.closeHomonimiasModal();
            this.searchEmployees();
          } else {
            this.toast.error(json.mensaje || 'Error al reactivar el empleado', '');
          }
        } catch (e) {
          this.toast.error('Respuesta inválida del servidor', '');
        }
      },
      error: (err) => {
        this.toast.error('Error al reactivar el empleado', '');
      }
    });
  }
}
