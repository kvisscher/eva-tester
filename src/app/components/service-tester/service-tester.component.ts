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
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { CultureSelectorComponent } from '../culture-selector/culture-selector.component';
import { settings } from '@springtree/eva-sdk-redux';
import { EndPointUrlService } from '../../services/end-point-url.service';
import { ClipboardService } from '../../services/clipboard.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import stackblitz from '@stackblitz/sdk';



enum ESelectedTabIndex {
  REQUEST = 0,
  RESPONSE = 1
}


/** This component will show the tester for a given service, it can do so with meta data fetched from the /tester/api/services/ end point */
@Component({
  selector: 'eva-service-tester',
  templateUrl: './service-tester.component.html',
  styleUrls: ['./service-tester.component.scss'],
  animations: [listAnimation, fadeInOut],
  providers: [CultureSelectorComponent]
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

  public loading = false;

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

  /** Response of the service */
  public response: any;

  /** Whether to expand all the json or not */
  public expandAllJson = null;

  public selectedTabIndex = ESelectedTabIndex.REQUEST;

  constructor(
    private $evaTypings: EvaTypingsService,
    private $serviceSelector: ServiceSelectorService,
    private $listServices: ListServicesService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private cultureSelectorComponent: CultureSelectorComponent,
    private $endPointUrlService: EndPointUrlService,
    public $clipboardService: ClipboardService,
    private snackbar: MatSnackBar
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
      });

    });
  }

  ngOnInit() { }

  /** Whenever a service is selected, we will fetch it and create a code template */
  onServiceChange(service: IListServiceItem) {

    this.response = null;

    this.loading = true;

    this.selectedTabIndex = ESelectedTabIndex.REQUEST;

    this.$serviceSelector.fetch(service.type).subscribe( async value => {
      this.loading = false;

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

  async preformRequest() {
    const request: any = await this.compileEditorInput();

    if ( request.SessionID ) {
      // Means the developer wanted to override the session id
      settings.sessionId = request.SessionID;
    }

    const culture = this.cultureSelectorComponent.getCultureKey();

    const httpOptions = { headers: {} };

    if ( culture ) {
      httpOptions.headers = new HttpHeaders({
        'Accept-Language': culture
      });
    }

    // To:do take Accept-Language into account, when the culture selector is built
    //
    this.http.post<any>(this.$endPointUrlService.endPointUrl + '/message/' + this.currentService.request.type, {
      ...request,
      SessionID: settings.sessionId
    }, httpOptions )
    .pipe(first())
    .toPromise()
    .then( response => {
      this.response = response;
    }).catch( exception => {
      this.response = exception.error;
    })
    .then(() => {
      this.selectedTabIndex = ESelectedTabIndex.RESPONSE;
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
      .replace(';', '') // getting rid of the semicolon
      .replace('\n', ''); // getting rid of new spaces

    // tslint:disable-next-line:no-eval
    const jsonObject: Object = eval(`(${jsObject})`);

    return jsonObject;
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

  copyResponse( response: any ) {
    this.$clipboardService.copyToClipboard(JSON.stringify(response, null, 2));

    this.snackbar.open('Resposne copied to clipboard', null, { duration: 3000 });
  }

  openCodeSample() {

    const serviceName = this.serviceListItem.name;
    const reducerName = serviceName.charAt(0).toLowerCase() + serviceName.slice(1);

    stackblitz.openProject({
      template: 'typescript',
      files: {
        'index.ts':
          `import { core } from '@springtree/eva-sdk-redux';
           import ${reducerName}Fn from  './${ reducerName }'
           import JSONFormatter from 'json-formatter-js';
            core.bootstrap({
            defaultToken: 'CECD606DF7FDEF93D751978346C36A43A07B53D3D5694BDCBC6DA6596A4CBCFD',
            endPointUrl: 'https://api.test.eva-online.cloud',
            appName: 'tester-demo',
            appVersion: '1.0.0',
            disableCartBootstrap: true,
            disableDataBootstrap: true,
          }).then(() => {
            return ${reducerName}Fn();
          }).then( response => {
            const formatter = new JSONFormatter(response, 2, {
                theme: 'dark',
                hoverPreviewEnabled: true,
            });

            const el = formatter.render()

            document.querySelector('#app').innerHTML = null;

            document.querySelector('#app').appendChild(el);
          }).catch(()=>{});
        `
         ,
        [`${reducerName}.ts`]:
          [
            `/** ⚠️  The store might not contain this reducer yet */`,
            `import { store, ${reducerName} } from '@springtree/eva-sdk-redux';`,
            `export default () => {`,
            `  const [action, fetchPromise] = ${reducerName}.createFetchAction({`,
            `  `,
            `  });`,
            `  `,
            `  store.dispatch(action)`,
            `  `,
            `  // Promise usage`,
            `  fetchPromise.then( ${reducerName}Response => {`,
            `    console.log(${reducerName}Response)`,
            `  }).catch( error => {`,
            `    console.error(error)`,
            `  });`,
            `  return fetchPromise`,
            `}`
          ].join('\n')
        ,
        'index.html': `
        <div id="app"></div>
        <style>
          body {
            background: black;
          }
        </style>
        `
      },
      dependencies: {
        '@springtree/eva-sdk-redux': '@latest',
        'lodash': '@latest',
        'rxjs': '5.5.12',
        'json-formatter-js': '@latest'
      },
      title: serviceName,
      description: `Auto created from ${window.location.origin}/service/${serviceName}`
    }, {
      devToolsHeight: 500,
      openFile: `${reducerName}.ts`
    });
  }
}
