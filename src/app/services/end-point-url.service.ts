import { Injectable } from '@angular/core';
import { isEqual } from 'lodash';
import { MatSnackBar } from '@angular/material';
import { ILoggable, Logger } from '../decorators/logger';
import { first } from 'rxjs/operators';

/**
 * The end point URL can be changed runtime, all services will be using this service to know where to point at
 */
@Logger
@Injectable()
export class EndPointUrlService implements ILoggable {
  public logger: Partial<Console>;

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

  async onChange(endPointUrl: string) {
    const keysToReset = ['selectedApplication', 'sessionId', 'userToken', 'selectedCulture'];

    keysToReset.forEach( key => localStorage.removeItem(key) );

    try {
      const url = new URL(endPointUrl);

      const protocol = url.protocol;

      const origin = url.origin;

      if (isEqual(protocol, window.location.protocol) === false) {
        const snackbar = this.snackbar.open(
          'Provided end point url has different protocol than this urls protocol',
          null, {
          duration: 5000
        });

        await snackbar.afterDismissed().pipe(first()).toPromise();
      }

      this.endPointUrl = origin;

      location.reload();
    } catch (e) {
      this.logger.error('Error parsing the given URL, please try again');

      this.snackbar.open('Error parsing the given URL, please try again', null, { duration: 5000 });
    }

  }
}
