import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MonacoEditorModule } from './components/editor';
import { HttpClientModule } from '@angular/common/http';
import { EvaTypingsService } from './services/eva-typings.service';
import { MatTabsModule } from '@angular/material/tabs';
import { ListServicesService } from './services/list-services.service';
import { tokenInterceptor } from './services/token-interceptor';

export const END_POINT_URL = 'https://api.test.eva-online.cloud';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MonacoEditorModule.forRoot(),
    HttpClientModule,
    BrowserAnimationsModule,
    MatTabsModule
  ],
  providers: [EvaTypingsService, ListServicesService, tokenInterceptor],
  bootstrap: [AppComponent]
})
export class AppModule { }
