import { Component, ElementRef, Input } from '@angular/core';
import JSONFormatter from 'json-formatter-js';


@Component({
  selector: 'eva-json-formatter',
  templateUrl: './json-formatter.component.html',
  styleUrls: ['./json-formatter.component.scss']
})
export class JsonFormatterComponent  {

  private _json: any;

  private formatter: JSONFormatter;

  public get json(): any {
    return this._json;
  }

  @Input()
  public set json(value: any) {
    if ( value !== this._json ) {
      this.updateView(value);
      this._json = value;
    }
  }

  private _expandAll;

  public get expandAll() {
    return this._expandAll;
  }

  @Input()
  public set expandAll(expandAll) {
    this._expandAll = expandAll;

    if ( expandAll === true ) {
      this.formatter.openAtDepth(Infinity);
    }

    if ( expandAll === false ) {
      this.formatter.openAtDepth(0);
    }

  }

  constructor(private el: ElementRef) { }

  updateView(json: any) {
    this.formatter = new JSONFormatter(json, 3, {
      theme: 'dark',
      hoverPreviewEnabled: true,
    });

    const el = this.formatter.render();

    (this.el.nativeElement as HTMLElement).innerHTML = null;

    (this.el.nativeElement as HTMLElement).appendChild(el);
  }
}
