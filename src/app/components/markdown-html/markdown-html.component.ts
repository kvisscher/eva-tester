import { Component, OnInit, Input, ElementRef, Injectable, OnDestroy } from '@angular/core';
import * as showdown from 'showdown';
import { ListServicesService } from '../../services/list-services.service';
import { first, map } from 'rxjs/operators';
import { Router } from '@angular/router';


@Injectable()
class EvaServiceHighLighter implements OnDestroy {

  codeElementsMap = new Map<HTMLElement, EventListenerOrEventListenerObject>();

  constructor(protected $listServices: ListServicesService, protected router: Router) { }

  /**
   * The docs tend to refer to other services in <code> </code> blocks
   * We will query all elements in the generated markdown, checkout all the code nodes and see if they are referring to any services
   */
  async highlightPotentialServices(el: HTMLElement) {

    const serviceNames = await this.$listServices.services$.pipe(
      map( values => values.map( service => service.name ) ),
      first()
    ).toPromise();

    Array.from(el.querySelectorAll('code')).filter( codeElement => {
      return serviceNames.includes(codeElement.innerText);
    })
    .forEach( codeElement => {

      codeElement.style.cursor = 'pointer';

      const handler = () => {
        this.router.navigate(['/service/' + codeElement.innerText]);
      };

      codeElement.addEventListener('click', handler);

      this.codeElementsMap.set(codeElement, handler);
    });
  }


  ngOnDestroy() {
    Array.from(this.codeElementsMap).forEach( ([codeElement, listener]) => {
      codeElement.removeEventListener('click', listener);
    });
  }
}

@Component({
  selector: 'eva-markdown-html',
  templateUrl: './markdown-html.component.html',
  styleUrls: ['./markdown-html.component.scss']
})
export class MarkdownHtmlComponent extends EvaServiceHighLighter implements OnInit  {

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

  constructor(private el: ElementRef, protected $listServices: ListServicesService, protected router: Router) {
    super($listServices, router);

    this.converter.setOption('emoji', true);
   }

  ngOnInit() {

  }

  convert(markdown: string) {
    const html = this.converter.makeHtml(markdown);

    (this.el.nativeElement as HTMLElement).innerHTML = html;

    this.highlightPotentialServices(this.el.nativeElement);
  }
}
