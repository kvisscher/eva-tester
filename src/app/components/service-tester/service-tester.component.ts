import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxEditorModel } from '../../components/editor';
import { EvaTypingsService } from '../../services/eva-typings.service';
import { ListServicesService } from '../../services/list-services.service';
import { ServiceSelectorService } from '../../services/service-selector.service';
import { EditorComponent } from '../editor/editor.component';

/** This component will show the tester for a given service, it can do so with meta data fetched from the /tester/api/services/ end point */
@Component({
  selector: 'eva-service-tester',
  templateUrl: './service-tester.component.html',
  styleUrls: ['./service-tester.component.scss']
})
export class ServiceTesterComponent implements OnInit {

  private _currentServiceName: any;

  public get currentServiceName(): any {
    return this._currentServiceName;
  }

  @Input()
  public set currentServiceName(value: any) {
    if ( value !== this._currentServiceName ) {
      this.onServiceChange(value);

      this._currentServiceName = value;
    }
  }

  @ViewChild(EditorComponent) monacoEditor: EditorComponent;

  public uniqueURI = `index-${Math.random()}.ts`;

  public monacoModel: NgxEditorModel = {
    value: this.createCodeTemplate('EVA.Core.Services.UpdateUser'),
    language: 'typescript',
    uri: this.uniqueURI
  };

  public monacoOptions = {
    theme: 'vs-dark'
  };

  public compileOutput: string;

  constructor(
    private $listServices: ListServicesService,
    private $evaTypings: EvaTypingsService,
    private $serviceSelector: ServiceSelectorService,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe( params => {
      // Updating the current service
      //
      this.currentServiceName = params.serviceName;
    });
  }

  ngOnInit() { }

  /** Whenever a service is selected, we will fetch it and create a code template */
  onServiceChange(value: any) {
    const newEditorValue = this.createCodeTemplate(value.request.ns + '.' + value.request.type);

    this.monacoEditor.writeValue(newEditorValue);
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

    // Whenever the editor loads, we want to fetch the typings a
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

    const codeWithoutParentheses = matchingOutput.text.replace('(', '').replace(')', '');

    /**
     * we want to split the code on new line and replace the first line with a {
     * and remove the rest 'const request' part
     */
    const splitCode = matchingOutput.text.split('\n');

    // Replacing the first line with an opening brace
    splitCode[0] = '{';

    // Joining the js object array and removing the semicolon so its valid json
    //
    const jsObject: string = splitCode.join('').replace(';', '');

    // tslint:disable-next-line:no-eval
    const jsonObject: Object = eval(`(${jsObject})`);

    const jsonString: string = JSON.stringify(jsonObject);

    this.compileOutput = jsonString;
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
