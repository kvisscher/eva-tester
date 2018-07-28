import { filter } from 'rxjs/operators/filter';
import { isNil } from 'lodash';
import { Observable } from 'rxjs/Observable';

/** This will ensure that a give stream is not nil */
export default function isNotNil<T>() {
  return (source: Observable<T>) => {
    return source.pipe(
      filter(value => !isNil(value))
    );
  };
}
