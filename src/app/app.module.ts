import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MonacoEditorModule } from './components/editor';
import { HttpClientModule } from '@angular/common/http';
import { EvaTypingsService } from './services/eva-typings.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';



import { ListServicesService } from './services/list-services.service';
import { tokenInterceptor } from './services/token-interceptor';
import { ApplicationsService } from './services/applications.service';
import { ServiceSelectorService } from './services/service-selector.service';
import { TesterComponent } from './pages/tester/tester.component';
import { HeaderComponent } from './components/header/header.component';


export const END_POINT_URL = 'https://api.test.eva-online.cloud';

@NgModule({
  declarations: [
    AppComponent,
    TesterComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MonacoEditorModule.forRoot(),
    HttpClientModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  providers: [
    tokenInterceptor,
    EvaTypingsService,
    ListServicesService,
    ApplicationsService,
    ServiceSelectorService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
