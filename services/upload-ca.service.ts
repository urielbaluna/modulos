import { Injectable } from '@angular/core';
import { enviroment } from '../../enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DecryptService } from './decrypt.service';

@Injectable({
  providedIn: 'root'
})
export class UploadCaService {
  fiIdUsuario = localStorage.getItem('fiIdUsuario');
  fiIdGrupoEmpresarial = "2";

  private consultPeriods = `${enviroment.endPointURL}/api/v1/private/manager/mensual/reportecobranza/periodos/consultar`
  private uploadFile = `${enviroment.endPointURL}/api/v1/private/manager/mensual/reportecobranza/periodos/subircarta`

  constructor(private http: HttpClient, private encrypt: DecryptService) { }

  getPeriods(request: any){
    let body = {
      fiIdUsuario: this.fiIdUsuario,
      cadena: request.cadena,
      fiIdGrupoEmpresarial: this.fiIdGrupoEmpresarial,
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.post(this.consultPeriods, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  uploadCaFile(request: any){
    let body = {
      fcCartaAceptacion: request.fcCartaAceptacion,
      fdFechaOdc: request.fdFechaOdc,
      fcDocumento: request.fcDocumento,
      periodos: request.periodos,
      nombre: request.nombre,
      tipo: request.tipo
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.post(this.uploadFile, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }
}
