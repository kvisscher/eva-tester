import { Injectable } from '@angular/core';

@Injectable()
export class ClipboardService {

constructor() { }

  /**
   * @param value to copy
   * @author Sangram Nandkhile
   * @see https://stackoverflow.com/a/49121680/4047409
   */
  public copyToClipboard(value: string) {
    const copyElement = document.createElement('textarea');
    copyElement.style.position = 'fixed';
    copyElement.style.left = '0';
    copyElement.style.top = '0';
    copyElement.style.opacity = '0';
    copyElement.value = value;
    document.body.appendChild(copyElement);
    copyElement.focus();
    copyElement.select();
    document.execCommand('copy');
    document.body.removeChild(copyElement);
  }

}
