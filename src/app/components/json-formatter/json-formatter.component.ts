import { Component, ElementRef, Input } from '@angular/core';
import JSONFormatter from 'json-formatter-js';


@Component({
  selector: 'eva-json-formatter',
  templateUrl: './json-formatter.component.html',
  styleUrls: ['./json-formatter.component.scss']
})
export class JsonFormatterComponent  {

  private _json: any;

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

  constructor(private el: ElementRef) { }

  updateView(json: any) {
    const formatter = new JSONFormatter(json, 3, {
      theme: 'dark',
      hoverPreviewEnabled: true,
    });

    const el = formatter.render();

    (this.el.nativeElement as HTMLElement).appendChild(el);
  }
}
