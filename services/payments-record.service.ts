import { Injectable } from '@angular/core';
import { enviroment } from '../../enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DecryptService } from './decrypt.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentsRecordService {
  fiIdUsuario = localStorage.getItem('fiIdUsuario');
  fiIdGrupoEmpresarial = "2";

  private consultWithCFDI = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/consultarConCfdi`
  private updateCFDI = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/actualizarCfdiToPago`

  constructor(private http: HttpClient, private encrypt: DecryptService) { }

  getRecords(request: any){
    let body = {
      fiIdUsuario: this.fiIdUsuario,
      fcCfdi: request.fcCfdi,
      fiIdGrupoEmpresarial: this.fiIdGrupoEmpresarial,
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.post(this.consultWithCFDI, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  updatdeCFDI(request: any){
    let body = {
      fcCfdi: request.fcCfdi,
      fdFechaPago: request.fdFechaPago,
      documentoBase64: request.documentoBase64,
      nombre: request.nombre,
      tipo: request.tipo
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.put(this.updateCFDI, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }
}
