import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger, ILoggable } from '../decorators/logger';
import { END_POINT_URL } from '../app.module';

/**
 * This service will be responsible for fetching the eva-typings, it will also store them in indexdb
 * for an optimal testing experience, beside that. Everytime the editor is loaded, it will fetch the typings in the background
 * and notify the user about new typings incase the newly fetched ones are different than the locally stored ones
 */
@Logger
@Injectable()
export class EvaTypingsService implements ILoggable {
  public logger: Partial<Console>;

  constructor(private http: HttpClient) {
    this.logger.log('constructed');
  }

  load() {
    return this.http.get<string>(`${END_POINT_URL}/api/definition/typescript?useDeclareModule=true`, {
      responseType: 'text' as any
    });
  }

  /** Caches the typings */
  cache(typings: string) {
    localStorage.setItem('typings', typings);
  }

}
