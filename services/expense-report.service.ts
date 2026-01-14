import { Injectable } from '@angular/core';
import { enviroment } from '../../enviroment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DecryptService } from './decrypt.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseReportService {

  private getExpenseReportURL = `${enviroment.endPointURL}/api/v1/private/manager/reportefinanciero/consultar/gasto`
  private getReportByPeriodURL = `${enviroment.endPointURL}/api/v1/private/manager/reportefinanciero/consultar/gasto/empresa`

  constructor(private http: HttpClient, private encrypt: DecryptService) { }

  getExpenseReport(request: any){
    return this.http.get(this.getExpenseReportURL, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getReportByPeriod(request: any){
    const url = `${this.getReportByPeriodURL}/${request.periodo}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }

  getReportByPeriodAndCompany(request: any){
    const url = `${this.getReportByPeriodURL}/${request.periodo}/${request.empresaId}`;
    return this.http.get(url, {
      headers: new HttpHeaders(), 
      responseType: 'text'
    });
  }
}
