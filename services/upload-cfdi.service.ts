import { Injectable } from '@angular/core';
import { enviroment } from '../../enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DecryptService } from './decrypt.service';

@Injectable({
  providedIn: 'root'
})
export class UploadCfdiService {
  fiIdUsuario = localStorage.getItem('fiIdUsuario');
  fiIdGrupoEmpresarial = "2";

  private consultWithoutCFDI = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/consultarSinCfdi`
  private updateCfdiURL = `${enviroment.endPointURL}/api/v1/private/manager/reporteGeneral/actualizarCatoCfdi`


  constructor(private http: HttpClient, private encrypt: DecryptService) { }

  getRecords(request: any){
    let body = {
      fiIdUsuario: this.fiIdUsuario,
      fcOdc: request.fcOdc,
      fiIdGrupoEmpresarial: this.fiIdGrupoEmpresarial,
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.post(this.consultWithoutCFDI, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  updateCfdi(request: any){
    let body = {
      fcCa: request.fcCa,
      fiOrdenServicio: request.fiOrdenServicio,
      fcCfdi: request.fcCfdi,
      fdFechaCfdi: request.fdFechaCfdi,
      fiMontoPago: request.fiMontoPago,
      documentoBase64: request.documentoBase64,
      nombre: request.nombre,
      tipo: request.tipo
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.put(this.updateCfdiURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }
}
