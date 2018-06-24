/// <reference path="../../../../node_modules/monaco-editor/monaco.d.ts" />
export interface DiffEditorModel {
    code: string;
    language: string;
}
export interface NgxEditorModel {
    value: string;
    language?: string;
    uri?: any;
}
