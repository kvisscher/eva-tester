import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AngularFusejsOptions } from 'angular-fusejs';
import { debounceTime } from '../../../../node_modules/rxjs/operators';
import { NgxEditorModel } from '../../components/editor';
import { EvaTypingsService } from '../../services/eva-typings.service';
import { ListServicesService, IService } from '../../services/list-services.service';
import { ServiceSelectorService } from '../../services/service-selector.service';
import { EditorComponent } from '../editor/editor.component';

@Component({
  selector: 'eva-tester',
  templateUrl: './tester.component.html',
  styleUrls: ['./tester.component.scss']
})
export class TesterComponent implements OnInit {

  @ViewChild(EditorComponent) monacoEditor: EditorComponent;

  public readonly services$ = this.$listServices.services$;

  public searchOptions: AngularFusejsOptions = {
    keys: ['name'],
    maximumScore: 0.5
  };

  public searchForm = this.formBuilder.group({
    search: [null]
  });

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

  searchTerms: string;

  constructor(
    private $listServices: ListServicesService,
    private formBuilder: FormBuilder,
    private $evaTypings: EvaTypingsService,
    private $serviceSelector: ServiceSelectorService
  ) {
    this.searchForm.get('search').valueChanges.pipe(debounceTime(500)).subscribe( (value: string) => {
      this.searchTerms = value;
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.monacoModel.value = 'fa;ljfakljfakl';
      console.log('override');
    }, 3000);
  }

  /** Whenever a service is selected, we will fetch it and create a code template */
  selectService(service: IService) {
    this.$serviceSelector.fetch(service.type).subscribe( (value: any) => {
      const newEditorValue = this.createCodeTemplate(value.request.ns + '.' + value.request.type);

      this.monacoEditor.writeValue(newEditorValue);
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

    // Whenever the editor loads, we want to fetch the typings a
    //
    this.$evaTypings.load().subscribe(typings => {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(typings, 'eva.d.ts');
    });
  }

  async compileEditorInput() {

    const model = monaco.editor.getModels()
      .find( potentialMatchingModel => potentialMatchingModel.uri.toString() === this.uniqueURI );
    /** @see https://github.com/Microsoft/monaco-typescript/pull/8 */
    const worker = await monaco.languages.typescript.getTypeScriptWorker();

    const client = await worker(model.uri);

    const output = await client.getEmitOutput(model.uri.toString());

    const matchingOutput: { name: string, text: string } = output.outputFiles.find( potentialMatchingOutput => {
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
