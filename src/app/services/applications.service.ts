import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EndPointUrlService } from './end-point-url.service';

@Injectable()
export class ApplicationsService {


  private _selectedApplication: EVA.Core.Services.ApplicationDto;

  private get selectedApplication(): EVA.Core.Services.ApplicationDto {
    return this._selectedApplication || JSON.parse( localStorage.getItem('selectedApplication') );
  }

  private set selectedApplication(newSelectedApplication: EVA.Core.Services.ApplicationDto) {
    this._selectedApplication = newSelectedApplication;

    localStorage.setItem('selectedApplication', JSON.stringify(newSelectedApplication));
  }

  constructor(private http: HttpClient, private $endPointUrlService: EndPointUrlService) { }

  fetch() {
    return this.http.post<EVA.Core.Services.ListApplicationsResponse>(
      this.$endPointUrlService.endPointUrl + '/message/ListApplications', {}
    );
  }

  setSelected( application: EVA.Core.Services.ApplicationDto ) {
    this.selectedApplication = application;
  }

  getSelected(): EVA.Core.Services.ApplicationDto {
    return this.selectedApplication;
  }
}
