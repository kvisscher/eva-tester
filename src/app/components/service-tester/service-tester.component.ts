import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { settings } from '@springtree/eva-sdk-redux';
import stackblitz from '@stackblitz/sdk';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, tap } from 'rxjs/operators';
import { NgxEditorModel } from '../../components/editor';
import { ClipboardService } from '../../services/clipboard.service';
import { EndPointUrlService } from '../../services/end-point-url.service';
import { EvaTypingsService } from '../../services/eva-typings.service';
import { IListServiceItem, ListServicesService } from '../../services/list-services.service';
import { IServiceResponse, ServiceSelectorService } from '../../services/service-selector.service';
import { fadeInOut, listAnimation } from '../../shared/animations';
import { CultureSelectorComponent } from '../culture-selector/culture-selector.component';
import { EditorComponent } from '../editor/editor.component';
import { ITesterState } from '../tester/tester.component';



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

  public currentService$: Observable<IServiceResponse>;

  public currentTypeSignature$: Observable<string>;

  public loading = false;

  private _testerState: ITesterState;

  public get testerState(): ITesterState {
    return this._testerState;
  }

  @Input()
  public set testerState(value: ITesterState) {
    console.log(value);
    this._testerState = value;
  }

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

  ngOnInit() {

  }

  /** Whenever a service is selected, we will fetch it and create a code template */
  onServiceChange(service: IListServiceItem) {

    this.response = null;

    this.loading = true;

    this.selectedTabIndex = ESelectedTabIndex.REQUEST;

    this.currentService$ = this.$serviceSelector.fetch(service.type);

    this.currentTypeSignature$ = this.currentService$.pipe(
      map( value => value.request.ns + '.' + value.request.type)
    );

    this.currentTypeSignature$.subscribe( currentTypeSignature => {
      const newEditorValue = this.createCodeTemplate(currentTypeSignature);

      this.form.get('editor').setValue(newEditorValue);
    });

    this.currentService$.subscribe( value => {
      this.loading = false;
    });
  }


  monacoLoad() {
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

    const currentService = await this.currentService$.pipe(first()).toPromise();

    // To:do take Accept-Language into account, when the culture selector is built
    //
    this.http.post<any>(this.$endPointUrlService.endPointUrl + '/message/' + currentService.request.type, {
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

  async openCodeSample() {

    const serviceName = this.serviceListItem.name;

    const reducerName = serviceName.charAt(0).toLowerCase() + serviceName.slice(1);

    const typings = await this.$evaTypings.load().pipe(first()).toPromise();

    const currentTypeSignature = await this.currentTypeSignature$.pipe(first()).toPromise();

    stackblitz.openProject({
      template: 'typescript',
      files: {
        'index.ts':
          `import { core } from '@springtree/eva-sdk-redux';
           import ${reducerName}Fn from  './${ reducerName }'
           import JSONFormatter from 'json-formatter-js';
            core.bootstrap({
            defaultToken: '${settings.userToken}',
            endPointUrl: '${settings.endPointURL}',
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
            `  } as Partial<${currentTypeSignature}>);`,
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
        `,
        'eva.d.ts': typings
      },
      dependencies: {
        '@springtree/eva-sdk-redux': '*',
        'lodash': '*',
        'rxjs': '5.5.12',
        'json-formatter-js': '*'
      },
      title: serviceName,
      description: `Auto created from ${window.location.origin}/service/${serviceName}`
    }, {
      devToolsHeight: 500,
      openFile: `${reducerName}.ts`
    });
  }
}
