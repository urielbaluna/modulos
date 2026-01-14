import { Injectable } from '@angular/core';
import { enviroment } from '../../enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DecryptService } from './decrypt.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private getEmployeesURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogosgenerales/cadena/empleados/consulta`
  private getCivilStatusesURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogosgenerales/consulta/estadocivil`
  private getAvailableTechnologiesURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogosgenerales/consulta/tecnologia`
  private getTypeDocumentsURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogosgenerales/consulta/tipodoctosempleado`
  private getBanksURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogosgenerales/consulta/banco`
  private getTipeOfReferencesURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogosgenerales/consulta/tiporeferencia`
  private searchProspectsURL = `${enviroment.endPointURL}/api/v1/private/manager/prospecto/consultarAllPros`
  private getAddressByEmployeeIdURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogos/domicilio`
  private getDocumentsEmployeeURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/consultar/documentos`
  private updateEmployeeURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/actualizar/empleado`
  private updateEmployeeAddressURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogos/domicilio/actualizarDomicilioEmpleado`
  private getStatesURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogos/estados/consultarTodos`
  private getMunicipalitiesURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogos/municipios/porEstado`
  private getColoniesURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogos/colonias/porEstadoMunicipio`
  private getColoniesByZipCodeURL = `${enviroment.endPointURL}/api/v1/private/manager/catalogos/estados/porCodigoPostal`
  private deleteEmployeeURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/eliminar/empleado`
  private insertDocumentEmployeeURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/insertar/documentos`
  private updateLaboralDatesURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/actualizar/datoslaborales`
  private vetarEmployeeURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/vetar/empleado`
  private fromProspectToEmployeeURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/insertar/datosgenerales`
  private getReferencesByEmployeeIdURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/consultar/referencias`
  private insertReferenceURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/insertar/referencias`
  private reactivateEmployeeURL = `${enviroment.endPointURL}/api/v1/private/manager/empleadonuevo/reactivar/empleado`

  constructor(private http: HttpClient, private encrypt: DecryptService) { }

  getEmployees(request: any){
    let body = {
      fcIdEmpleado: request.fcIdEmpleado,
      fcCadena: request.fcCadena,
      fiIdStatus: request.fiIdStatus
    }
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(body));
    return this.http.post(this.getEmployeesURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }
  
  getCivilStatuses(){
    return this.http.get(this.getCivilStatusesURL, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getAvailableTechnologies(){
    return this.http.get(this.getAvailableTechnologiesURL, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getTypeDocuments(){
    return this.http.get(this.getTypeDocumentsURL, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getBanks(){
    return this.http.get(this.getBanksURL, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getTypeOfReferences(){
    return this.http.get(this.getTipeOfReferencesURL, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getProspects(request: any){
    const url = `${this.searchProspectsURL}?cadena=${request.cadena}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getAddressByEmployeeId(request: any){
    const url = `${this.getAddressByEmployeeIdURL}/${request.fiIdEmpleado}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getDocumentsEmployee(request: any){
    const url = `${this.getDocumentsEmployeeURL}/${request.fiIdEmpleado}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  updateEmployee(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    console.log(request);
    
    return this.http.put(this.updateEmployeeURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  updateEmployeeAddress(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.put(this.updateEmployeeAddressURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getStates(){
    return this.http.get(this.getStatesURL, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getMunicipalities(request: any){
    const url = `${this.getMunicipalitiesURL}?fiIdEstado=${request.fiIdEstado}&fcEstado=${request.fcEstado}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getColonies(request: any){
    const url = `${this.getColoniesURL}?fiIdEstado=${request.fiIdEstado}&fiIdMunicipio=${request.fiIdMunicipio}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getColoniesByZipCode(request: any){
    const url = `${this.getColoniesByZipCodeURL}/${request.fiCp}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  deleteEmployee(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.patch(this.deleteEmployeeURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  insertDocumentEmployee(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.post(this.insertDocumentEmployeeURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  updateLaboralDates(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.put(this.updateLaboralDatesURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  vetarEmployee(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.patch(this.vetarEmployeeURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  fromProspectToEmployee(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.post(this.fromProspectToEmployeeURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getReferencesByEmployeeId(request: any){
    const url = `${this.getReferencesByEmployeeIdURL}/?fcIdEmpleado=${request.fiIdEmpleado}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  insertReference(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.post(this.insertReferenceURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  reactivateEmployee(request: any){
    const encryptedBody = this.encrypt.encryptReq(JSON.stringify(request));
    return this.http.put(this.reactivateEmployeeURL, encryptedBody, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }
}
