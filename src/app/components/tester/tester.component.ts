import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AngularFusejsOptions } from 'angular-fusejs';
import { debounceTime } from '../../../../node_modules/rxjs/operators';
import { ListServicesService } from '../../services/list-services.service';
import { NgxEditorModel } from '../../components/editor';
import { EvaTypingsService } from '../../services/eva-typings.service';

@Component({
  selector: 'eva-tester',
  templateUrl: './tester.component.html',
  styleUrls: ['./tester.component.scss']
})
export class TesterComponent implements OnInit {

  public readonly services$ = this.$listServices.services$;

  public searchOptions: AngularFusejsOptions = {
    keys: ['name'],
    maximumScore: 0.5
  };

  public searchForm = this.formBuilder.group({
    search: [null]
  });

  public code = [
    '({',
    `  LanguageID: '1'`,
    '} as Partial<EVA.Core.Services.UpdateUser>);'
  ].join('\n');

  public monacoModel: NgxEditorModel = {
    value: this.code,
    language: 'typescript',
    uri: 'index.ts'
  };

  public monacoOptions = {
    theme: 'vs-dark'
  };

  searchTerms: string;

  constructor(
    private $listServices: ListServicesService,
    private formBuilder: FormBuilder,
    private $evaTypings: EvaTypingsService
  ) {
    this.$listServices.fetch();

    this.searchForm.get('search').valueChanges.pipe(debounceTime(500)).subscribe( (value: string) => {
      this.searchTerms = value;
    });
  }

  ngOnInit() {
  }

  selectService() {

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

  compileEditorInput() {

    const models = monaco.editor.getModels();

    const model = models[0];

    monaco.languages.typescript.getTypeScriptWorker().then(worker => {
      worker(model).then(client => {
        console.log(client);

        const output = client.getEmitOutput(model.uri.toString()).then(console.log);

        console.log(output);
      });
    });
  }

}
