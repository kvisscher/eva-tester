import { kebabCase, isFunction } from 'lodash';

/** Any class decorated by the logger class should implement this interface */
export interface ILoggable {
  logger: Partial<Console>;
}

/** Kebabcases the class name */
export const kebabClassName = (ref: Object) => {
  const componetName = kebabCase(ref.constructor.name);

  return componetName;
};

export const createLogger = (prefix: string): Partial<Console> => {
  const supportedMethods = Object.keys(console);
  const customConsole: Partial<Console> = {};

  supportedMethods.forEach(function (method) {
    if (isFunction(console[method])) {
      customConsole[method] = (console[method] as Function).bind(console, `%c${prefix}`, 'color: green; font-weight:bold;');
    }
  });

  return customConsole;
};


/** Simply use this Decorator like so
 *
 * @Logger()
 * Class FooBar implements ILoggable {
 *  logger: Partial<console>;
 *
 *  constructor() {
 *    this.logger.log('x') // [foo-bar] x
 *  }
 * }
 *
 *
 */
export function Logger(target) {
    const kebabCasedName = kebabClassName(target.prototype);
    target.prototype.logger = createLogger(`[${kebabCasedName}]`);
}
