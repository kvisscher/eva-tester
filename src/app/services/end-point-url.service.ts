import { Injectable } from '@angular/core';

/**
 * The end point URL can be changed runtime, all services will be using this service to know where to point at
 */
@Injectable()
export class EndPointUrlService {

  private _selectedEndPointUrl = 'https://api.test.eva-online.cloud';

  public get endPointUrl(): string {
    return this._selectedEndPointUrl || JSON.parse(localStorage.getItem('endPointUrl'));
  }

  public set endPointUrl( endPointUrl: string ) {
    if ( endPointUrl !== this._selectedEndPointUrl ) {
      this._selectedEndPointUrl = endPointUrl;

      if ( this.endPointUrls.includes(endPointUrl) === false ) {
        this.endPointUrls = [ endPointUrl, ...this.endPointUrls ];
      }

      localStorage.setItem('endPointUrl', JSON.stringify(endPointUrl));
    }
  }


  private _endPointUrls: string[];

  public get endPointUrls(): string[] {
    return this._endPointUrls || JSON.parse(localStorage.getItem('endPointUrls'));
  }

  public set endPointUrls( endPointUrls: string[] ) {
    this._endPointUrls = endPointUrls;

    localStorage.setItem('endPointUrls', JSON.stringify(endPointUrls));
  }

  constructor() { }

  onChange(endPointUrl: string) {
    const keysToReset = ['selectedApplication', 'sessionId', 'userToken', 'selectedCulture'];

    keysToReset.forEach( key => localStorage.removeItem(key) );

    this.endPointUrl = endPointUrl;

    location.reload();
  }
}
