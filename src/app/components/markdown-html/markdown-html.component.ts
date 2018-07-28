import { Component, OnInit, Input, ElementRef } from '@angular/core';
import * as showdown from 'showdown';

@Component({
  selector: 'eva-markdown-html',
  templateUrl: './markdown-html.component.html',
  styleUrls: ['./markdown-html.component.scss']
})
export class MarkdownHtmlComponent implements OnInit {

  private converter = new showdown.Converter();

  private _markdown: string;

  public get markdown(): string {
    return this._markdown;
  }

  @Input()
  public set markdown(markdown: string) {
    this.convert(markdown);

    this._markdown = markdown;
  }

  constructor(private el: ElementRef) { }

  ngOnInit() {

  }

  convert(markdown: string) {
    const html = this.converter.makeHtml(markdown);

    (this.el.nativeElement as HTMLElement).innerHTML = html;
  }

}
