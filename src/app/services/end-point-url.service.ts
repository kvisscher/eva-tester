import { Injectable } from '@angular/core';
import { isEqual } from 'lodash';
import { MatSnackBar } from '@angular/material';

/**
 * The end point URL can be changed runtime, all services will be using this service to know where to point at
 */
@Injectable()
export class EndPointUrlService {

  /** Fallback endpoint url if none are present */
  private DEFAULT_ENDPOINT_URL = 'https://api.test.eva-online.cloud';

  private _selectedEndPointUrl: string;

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
    return this._endPointUrls || JSON.parse(localStorage.getItem('endPointUrls')) || [];
  }

  public set endPointUrls( endPointUrls: string[] ) {
    this._endPointUrls = endPointUrls;

    localStorage.setItem('endPointUrls', JSON.stringify(endPointUrls));
  }

  constructor(private snackbar: MatSnackBar ) {
    if ( ! this.endPointUrl ) {
      this.endPointUrl = this.DEFAULT_ENDPOINT_URL;
    }
  }

  onChange(endPointUrl: string) {
    const keysToReset = ['selectedApplication', 'sessionId', 'userToken', 'selectedCulture'];

    keysToReset.forEach( key => localStorage.removeItem(key) );

    if ( isEqual(new URL(endPointUrl).protocol, window.location.protocol) === false ) {
      this.snackbar.open('Provided end point url has different protocol than this urls protocol', null, { duration: 5000 });
    }

    this.endPointUrl = endPointUrl;

    location.reload();
  }
}