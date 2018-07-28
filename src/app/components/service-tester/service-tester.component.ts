import { Component, Input, OnInit, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxEditorModel } from '../../components/editor';
import { EvaTypingsService } from '../../services/eva-typings.service';
import { IListServiceItem, ListServicesService } from '../../services/list-services.service';
import { IServiceResponse, ServiceSelectorService } from '../../services/service-selector.service';
import { EditorComponent } from '../editor/editor.component';
import { tap, filter, first } from 'rxjs/operators';
import { listAnimation, fadeInOut } from '../../shared/animations';
import { FormBuilder } from '@angular/forms';

/** This component will show the tester for a given service, it can do so with meta data fetched from the /tester/api/services/ end point */
@Component({
  selector: 'eva-service-tester',
  templateUrl: './service-tester.component.html',
  styleUrls: ['./service-tester.component.scss'],
  animations: [listAnimation, fadeInOut]
})
export class ServiceTesterComponent implements OnInit {

  private _serviceListeItem: IListServiceItem;

  public get serviceListItem(): IListServiceItem {
    return this._serviceListeItem;
  }

  @Input()
  public set serviceListItem(value: IListServiceItem) {
    if ( value !== this._serviceListeItem ) {
      this.onServiceChange(value);

      this._serviceListeItem = value;
    }
  }

  public currentService: IServiceResponse;

  @ViewChild(EditorComponent) monacoEditor: EditorComponent;

  /** This will help us compile different files in the future, when we add tabs support */
  public uniqueURI = `index-${Math.random()}.ts`;

  public monacoModel: NgxEditorModel = {
    language: 'typescript',
    uri: this.uniqueURI,
    value: null
  };

  public monacoOptions = {
    theme: 'vs-dark',
    minimap: {
      enabled: false
    }
  };

  public form = this.formBuilder.group({
    editor: [null]
  });

  constructor(
    private $evaTypings: EvaTypingsService,
    private $serviceSelector: ServiceSelectorService,
    private $listServices: ListServicesService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {

    this.route.params.pipe(
      filter( params => Boolean((params as any).serviceName) )
    )
    .subscribe( params => {
      // Updating the current service
      //
      const serviceName: string = params.serviceName as string;

      this.$listServices.services$.pipe(
        tap( services => {
          if ( !services ) {
            this.$listServices.fetch();
          }
        })
      ).subscribe( services => {
        const matchingService = services.find( service => service.name.toLowerCase() === serviceName.toLowerCase()  );

        this.serviceListItem = matchingService;
      } );

    });
  }

  ngOnInit() { }

  /** Whenever a service is selected, we will fetch it and create a code template */
  onServiceChange(service: IListServiceItem) {
    this.currentService = null;

    this.$serviceSelector.fetch(service.type).subscribe( async value => {
      this.currentService = value;

      const newEditorValue = this.createCodeTemplate(value.request.ns + '.' + value.request.type);

      this.form.get('editor').setValue(newEditorValue);
    });
  }


  monacoLoad() {
    // monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    //   schemas: [{
    //     uri: null,
    //     fileMatch: ['foo.json'],
    //     schema: {
    //       type: 'object',
    //       properties: {
    //         p1: {
    //           enum: ['v1', 'v2']
    //         }
    //       }
    //     }
    //   }]
    // });

    // Whenever the editor loads, we want to fetch the typings
    //
    this.$evaTypings.load().subscribe(typings => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(typings, 'eva.d.ts');
    });
  }

  async compileEditorInput() {

    const model = monaco.editor.getModels()
      .find(potentialMatchingModel => potentialMatchingModel.uri.toString() === this.uniqueURI);
    /** @see https://github.com/Microsoft/monaco-typescript/pull/8 */
    const worker = await monaco.languages.typescript.getTypeScriptWorker();

    const client = await worker(model.uri);

    const output = await client.getEmitOutput(model.uri.toString());

    const matchingOutput: { name: string, text: string } = output.outputFiles.find(potentialMatchingOutput => {
      /** transforming ts uri to js because output files will be javascript files */
      const jsURI = this.uniqueURI.replace('ts', 'js');
      const match = potentialMatchingOutput.name === jsURI;

      return match;
    });

    console.log(matchingOutput);

    // Joining the js object array and removing the semicolon so its valid json
    //
    const jsObject: string = matchingOutput.text
      .replace('const request =', '') // getting rid of the assignemnt
      .replace(';', ''); // getting rid of the semicolon

    // tslint:disable-next-line:no-eval
    const jsonObject: Object = eval(`(${jsObject})`);

    const jsonString: string = JSON.stringify(jsonObject);

    return jsonString;
  }

  /** Returns the template that casts an empty object to a given eva type */
  createCodeTemplate(requestType: string): string {
    const codeTemplate = [
      `const request: Partial<${requestType}> = {`,
      '  ',
      `}`
    ].join('\n');

    return codeTemplate;
  }

}
