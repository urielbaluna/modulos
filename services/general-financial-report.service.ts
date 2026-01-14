import { Injectable } from '@angular/core';
import { enviroment } from '../../enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DecryptService } from './decrypt.service';

@Injectable({
  providedIn: 'root'
})
export class GeneralFinancialReportService {
  fiIdUsuario = localStorage.getItem('fiIdUsuario');
  fiIdGrupoEmpresarial = "2";

  private getReport = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/consultar`;
  private updatePeriod = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/actualizarPeriodo`;
  private getStatus = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/consultarStatus`;
  private updateStatus = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/actualizarStatus`;
  private headers = new HttpHeaders();


  constructor(private http: HttpClient, private encrypt: DecryptService) { }

  getReportGeneral(request: any){
    let body = {
      fiIdUsuario: this.fiIdUsuario,
      fiAnio: null,
      fiMes: null,
      cadena: request.cadena,
      fiIdStatus: null,
      fiIdGrupoEmpresarial: this.fiIdGrupoEmpresarial,
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.post(this.getReport, encryptedBody, {
      headers: this.headers, 
      responseType: 'text'
    });
  }

  updateReportPeriod(request: any){
    let body = {
      fiIdUsuario: this.fiIdUsuario,
      fiIdPeriodoFact: request.fiIdPeriodo,
      fiIdAsignacion: request.fiIdAsignacion,
      fiIdEmpresa: request.fiIdEmpresa,
      fiIdEmpleado: request.fiIdEmpleado,
      fdFechaFinal: request.fdFechaFinal === '' ? null : request.fdFechaFinal,
      fdFechaInicial: request.fdFechaInicial === '' ? null : request.fdFechaInicial,
      fiTarifa: request.fiTarifa === '' ? null : request.fiTarifa,
      fcOdc: request.fcOdc,
      fdFechaOdc: request.fdFechaOdc === '' ? null : request.fdFechaOdc,
      fcCfdi: request.fcCfdi,
      fdFechaCfdi: request.fdFechaCfdi === '' ? null : request.fdFechaCfdi,
      fdFechaPago: request.fdFechaPago === '' ? null : request.fdFechaPago,
      fiOrden: request.fiOrden === '' ? null : request.fiOrden,
      fcComentarios: request.fcComentarios === '' ? null : request.fcComentarios,
      fiMontoPago: request.fiMontoPago === '' ? null : request.fiMontoPago,
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.put(this.updatePeriod, encryptedBody, {
      headers: this.headers, 
      responseType: 'text'
    });
  }

  getReportStatus(request: any){
    let body = {
      fiIdStatus: request.fiIdStatus
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.post(this.getStatus, encryptedBody, {
      headers: this.headers, 
      responseType: 'text'
    });
  }

  updateStatusPeriodo(request: any){
    let body = {
      fiIdUsuario: this.fiIdUsuario,
      fiIdPeriodoFact: request.fiIdPeriodo,
      fiIdAsignacion: request.fiIdAsignacion,
      fiIdEmpresa: request.fiIdEmpresa,
      fiIdEmpleado: request.fiIdEmpleado,
      fiIdStatus: request.fiIdStatus,
      documentoBase64: request.documentoBase64,
      nombre: request.nombre,
      tipo: 'application/pdf',
      fdFechaCreacion: request.fdFechaRegistro,
      fdFechaBitacora: request.fdFechaBitacora,
      fdFechaOdc: request.fdFechaOdc,
      fdFechaCfdi: request.fdFechaCfdi,
      fdFechaPago: request.fdFechaPago,
      fcOdc: request.fcOdc,
      fcCfdi: request.fcCfdi
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.put(this.updateStatus, encryptedBody, {
      headers: this.headers, 
      responseType: 'text'
    });
  }

}
