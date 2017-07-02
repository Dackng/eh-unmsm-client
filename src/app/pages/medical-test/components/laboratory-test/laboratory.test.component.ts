import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { Logger } from "angular2-logger/core";

import {Patient} from '../../../../models/patient';
import {Catalog} from '../../../../models/catalog';
import {Emr} from '../../../../models/emr';
import {Utils} from '../../../../models/utils';
import {LaboratoryTest} from '../../../../models/medical-test/laboratory.test';
import {LaboratoryTestService} from '../../../../services/medical-test/laboratory.test.service';
import {EmrService} from '../../../../services/emr.service';
import {CatalogService} from '../../../../services/catalog.service';
import {CommonService} from '../../../../services/common.service';

import { ModalDirective } from 'ng2-bootstrap';

@Component({
    selector: 'laboratory',
    styleUrls: ['../../../../theme/sass/_disabled.scss', 
                '../../../../theme/sass/_basicTables.scss',
                '../../../../theme/sass/_modals.scss'],
    templateUrl: './laboratory-test.html',
    providers: [Logger, LaboratoryTestService, EmrService, CatalogService, 
        CommonService]
})

export class LaboratoryTestComponent implements OnInit{ 
    emrUpdated: Emr;
    laboratoryTest: LaboratoryTest;
    currentHealthPlan: Catalog;
    patientCode: number;
    isLaboratoryTestRegistered: boolean;
    serologicalItemList: Array<Catalog>;
    bloodTypeItemList: Array<Catalog>;
    hemoglobinStateItemList: Array<Catalog>;
    genderItemList: Array<string>;
    emrStateItemList: Array<Catalog>;
    isFieldDisabled: boolean;
    errorMessage: string;

    ngOnInit(){
        this.initilize();
    }

    constructor(private _logger: Logger, private _catalogService: CatalogService
        , private _emrService: EmrService, private _laboratoryTestService: LaboratoryTestService, private _commonService: CommonService) {
        this._logger.warn("Constructor()");
        let itemByDefault = Utils.getSelectItemByDefault();
        this._logger.warn("===== Calling method CATALOG API:  getSerologicalTestList() =====");
        this._catalogService.getSerologicalTestList()
            .subscribe( (serologicalItemList : Array<Catalog> ) => {
                this.serologicalItemList = serologicalItemList;
                this.serologicalItemList.push(itemByDefault);
                this._logger.warn("OUTPUT=> serologicalItemList : " + JSON.stringify(this.serologicalItemList));
        }, error => this.errorMessage = <any> error);
        this._logger.warn("===== Calling method CATALOG API:  getBloodTypeList() =====");
        this._catalogService.getBloodTypeList()
            .subscribe( (bloodTypeItemList : Array<Catalog> ) => {
                this.bloodTypeItemList = bloodTypeItemList;
                this.bloodTypeItemList.push(itemByDefault);
                this._logger.warn("OUTPUT=> bloodTypeItemList : " + JSON.stringify(this.bloodTypeItemList));
        }, error => this.errorMessage = <any> error);
        this._logger.warn("===== Calling method CATALOG API: getGenderList() =====");
        this._catalogService.getGenderList()
            .subscribe( (genderItemList : Array<string> ) => {
                this.genderItemList = genderItemList;
                this._logger.warn("OUTPUT=> genderItemList : " + JSON.stringify(this.genderItemList));
            }, error => this.errorMessage = <any> error);
        this._logger.warn("===== Calling method CATALOG API: getHemoglobinStateList() =====");
        this._catalogService.getHemoglobinStateList()
            .subscribe( (hemoglobinStateItemList : Array<Catalog> ) => {
                this.hemoglobinStateItemList = hemoglobinStateItemList;
                this._logger.warn("OUTPUT=> hemoglobinStateItemList : " + JSON.stringify(this.hemoglobinStateItemList));
            }, error => this.errorMessage = <any> error);
        this._logger.warn("===== Calling method CATALOG API: getEmrStateList() =====");
        this._catalogService.getEmrStateList()
            .subscribe( (emrStateItemList : Array<Catalog> ) => {
                this.emrStateItemList = emrStateItemList;
                this._logger.warn("OUTPUT=> emrStateItemList : " + JSON.stringify(this.emrStateItemList));
            }, error => this.errorMessage = <any> error);
    }

    receiveOutputExternalOfPatient(patient: Patient){
        if(patient != null){
            this._commonService.notifyMedicalTestProcessComponent(
                //sending signal for get process table
                {patientCode: patient.code 
                , healthPlanId: this.currentHealthPlan.secondaryId
                , emrStateItemList:this.emrStateItemList});
            this.validateEMRAndLaboratoryTestExistence(patient);
        }else{
            this.initilize();
        }   
    }
    
    receiveOutputExternalOfCurrentHealthPlan(currentHealthPlan: Catalog){
        this.currentHealthPlan = currentHealthPlan;
        this._logger.warn("ReceiveOutput currentHealthPlan="+JSON.stringify(this.currentHealthPlan));   
    }

    validateEMRAndLaboratoryTestExistence(patient: Patient){
        this._logger.warn("===== Calling EMR API: getEmrByHealthPlanIdAndPatientCode(" + this.currentHealthPlan.secondaryId 
                    + ", " + patient.code + ") =====");
        this._emrService.getEmrByHealthPlanIdAndPatientCode(this.currentHealthPlan.secondaryId, patient.code)
            .subscribe( (emr: Emr) => {
                if (emr != null){
                    this.emrUpdated = emr;
                    this._logger.warn("EMR already registered");
                    this._logger.warn("===== Calling LaboratoryTest API: getLaboratoryTestByHealthPlanIdAndPatientCode("
                            + this.currentHealthPlan.secondaryId + ", " + patient.code + ") =====");
                    this._laboratoryTestService
                        .getLaboratoryTestByHealthPlanIdAndPatientCode(emr.healthPlanId, emr.patientCode)
                        .subscribe( (laboratoryTest: LaboratoryTest) => {
                            if(laboratoryTest != null){
                                this._logger.warn("LaboratoryTest already registered");
                                this.laboratoryTest.setFieldsDetail(laboratoryTest);
                                this._commonService.notifyFindPacientComponent(
                                    //sending signal for write other patient code
                                    {initilizePatientCode:patient.code 
                                    , initilizePatient: patient, initilizeIsActive:false});
                            }else{
                                this._logger.warn("LaboratoryTest is not registered yet");
                                this.laboratoryTest = new LaboratoryTest();
                                this.laboratoryTest.hemoglobinStateItemList = this.hemoglobinStateItemList;
                                this.laboratoryTest.isPatientOfMaleGender = 
                                    Utils.isMaleGender(patient.gender, this.genderItemList[0].toString());
                                this.laboratoryTest.ageInYearsOfPatient = 
                                    Utils.calculateDifferenceInYears(new Date(), patient.birthDate);
                                this.laboratoryTest.emrHealthPlanId = this.currentHealthPlan.secondaryId;
                                this.laboratoryTest.emrPatientCode = patient.code;
                                this.isLaboratoryTestRegistered = false;
                            }
                        }, error => this.errorMessage = <any> error);                        
                }else{
                    this._logger.warn("EMR doesn't be registered yet, should register EMR for this patient");
                }
            }, error => this.errorMessage = <any> error);
    }

    registerLaboratoryTest(isFormValided : boolean){
        this.isFieldDisabled = true;
        if(isFormValided){
            this._logger.warn("===== Calling LaboratoryTest API: registerLaboratoryTest()");
            this._logger.warn("INPUT => LaboratoryTest: "+JSON.stringify(this.laboratoryTest));
            this._laboratoryTestService.registerLaboratoryTest(this.laboratoryTest)
                .subscribe(test => {
                    this._logger.warn("*****LaboratoryTest registered successful*****");
                    this._emrService.validateEmrState(this.laboratoryTest.emrHealthPlanId,
                        this.laboratoryTest.emrPatientCode, this.emrUpdated).subscribe(emr => {
                            this._logger.warn("*****EMR state valid successful*****");
                            this.initilize();
                        }, error => this.errorMessage = <any> error);
                }, error => this.errorMessage = <any> error);
        } 
    }

    initilize(){
        this.patientCode = null;
        this.isLaboratoryTestRegistered = true;
        this.isFieldDisabled = false;
        this.errorMessage = null;
        this.laboratoryTest = new LaboratoryTest();
        this.emrUpdated = new Emr();
        this.initilizeChildComponents();
    }

    private initilizeChildComponents(){
        this._commonService.notifyFindPacientComponent({initilizePatientCode:null
            , initilizePatient: new Patient(), initilizeIsActive:false});
        this._commonService.notifyMedicalTestProcessComponent(
            {patientCode: null 
            , healthPlanId: null
            , emrStateItemList:null});
    }
}