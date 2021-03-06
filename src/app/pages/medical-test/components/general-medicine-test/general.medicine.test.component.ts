import {Component, Input, Output, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import { Logger } from "angular2-logger/core";

import {Patient} from '../../../../models/patient';
import {Catalog} from '../../../../models/catalog';
import {Emr} from '../../../../models/emr';
import {Utils} from '../../../../models/utils';
import {Constants} from '../../../../models/constants';
import {GeneralMedicineTest} from '../../../../models/medical-test/general.medicine.test';
import {Symptom} from '../../../../models/medical-test/symptom';
import {GeneralMedicineTestService} from '../../../../services/medical-test/general.medicine.test.service';
import {EmrService} from '../../../../services/emr.service';
import {CatalogService} from '../../../../services/catalog.service';
import {CommonService} from '../../../../services/common.service';

import { ModalDirective } from 'ng2-bootstrap';

@Component({
    selector: 'general-medicine',
    styleUrls: ['../../../../theme/sass/_disabled.scss', 
                '../../../../theme/sass/_basicTables.scss',
                '../../../../theme/sass/_modals.scss'],
    templateUrl: './general-medicine-test.html',
    providers: [Logger, GeneralMedicineTestService, EmrService, CatalogService, CommonService]
})

export class GeneralMedicineTestComponent implements OnInit{ 
    pageAddressTab: string = "/pages/medical-test/general-medicine-test";
    emrUpdated: Emr;
    generalMedicineTest: GeneralMedicineTest;
    symptom: Symptom;
    currentHealthPlan: Catalog;
    isGeneralMedicineTestRegistered: boolean;
    isFieldDisabled: boolean;
    isModalInvalidated: boolean;
    errorMessage: string;
    symptomTypeItemList: Array<Catalog>;
    cieItemList: Array<Catalog>;
    emrStateItemList: Array<Catalog>;
    genderItemList: Array<string>;
    generalMedicineItem: Catalog;
    @ViewChild('addSymptomModal') addSymptomModal: ModalDirective;
    
    ngOnInit(){
        this.initilize();
    }

    constructor(private _logger: Logger, private _catalogService: CatalogService
        , private _emrService: EmrService, private _generalMedicineTestService: GeneralMedicineTestService
        , private _commonService: CommonService) {
        this._logger.warn("Constructor()");
        let itemByDefault = Utils.getSelectItemByDefault();
        this._catalogService.getSymptomTypeList()
            .subscribe( (symptomTypeItemList : Array<Catalog> ) => {
                this.symptomTypeItemList = symptomTypeItemList;
                this.symptomTypeItemList.push(itemByDefault);
                this._logger.warn("OUTPUT=> symptomTypeItemList : " + JSON.stringify(this.symptomTypeItemList));
        }, error => this.errorMessage = <any> error);
        this._catalogService.getCIEList()
            .subscribe( (cieItemList : Array<Catalog> ) => {
                this.cieItemList = cieItemList;
                this.cieItemList.push(itemByDefault);
                this._logger.warn("OUTPUT=> cieItemList : " + JSON.stringify(this.cieItemList));
        }, error => this.errorMessage = <any> error);
        this._logger.warn("===== Calling method CATALOG API: getEmrStateList() =====");
        this._catalogService.getEmrStateList()
            .subscribe( (emrStateItemList : Array<Catalog> ) => {
                this.emrStateItemList = emrStateItemList;
                this._logger.warn("OUTPUT=> emrStateItemList : " + JSON.stringify(this.emrStateItemList));
            }, error => this.errorMessage = <any> error);
        this._logger.warn("===== Calling method CATALOG API: getGenderList() =====");
        this._catalogService.getGenderList()
            .subscribe( (genderItemList : Array<string> ) => {
                this.genderItemList = genderItemList;
                this._logger.warn("OUTPUT=> genderItemList : " + JSON.stringify(this.genderItemList));
            }, error => this.errorMessage = <any> error);
        this._logger.warn("===== Calling method CATALOG API: getGeneralMedicineTest() =====");
        this._catalogService.getGeneralMedicineTest()
            .subscribe( (generalMedicineItem : Catalog ) => {
                this.generalMedicineItem = generalMedicineItem;
                this._logger.warn("OUTPUT=> generalMedicineItem : " + JSON.stringify(this.generalMedicineItem));
            }, error => this.errorMessage = <any> error);
    }

    showAddSymptomModal(){
        this.addSymptomModal.config.backdrop = false;
        this.isModalInvalidated = false;
        this.symptom = new Symptom();
        this.addSymptomModal.show();
    }

    hideAddSymptomModal(){
        this.addSymptomModal.hide();
    }

    //First, valid form then valid if symptom don't have index for edit because this depend for add or edit
    saveSymptomChanges(isFormValided : boolean){
        this.isModalInvalidated = true;
        if(isFormValided){
            this._findValueSelected();
            this.symptom.isRegistered = true;
            if(this.symptom.indexForEdit == null){
                this._addSymptom();
            }else{
                this._editSymptom();
            }        
            this.hideAddSymptomModal();
        }
    }

    consultSymptom(index: number){
        this.addSymptomModal.config.backdrop = false;
        this.symptom = new Symptom();
        this.symptom.setFieldsDetail(this.generalMedicineTest.symptoms[index]);
        this.symptom.isRegistered = true;
        this.addSymptomModal.show();
    }

    showEditSymptomModal(index: number){
        this.addSymptomModal.config.backdrop = false;
        this.symptom = new Symptom();
        this.symptom.isRegistered = false;
        this.isModalInvalidated = false;
        this.symptom.setFieldsDetail(this.generalMedicineTest.symptoms[index]);
        this.symptom.indexForEdit = index;
        this.addSymptomModal.show();
    }

    removeSymptom(symptom: Symptom){
        let index: number = this.generalMedicineTest.symptoms.indexOf(symptom);
        if (index !== -1) {
            this.generalMedicineTest.symptoms.splice(index, 1);
        }      
    }

    receiveOutputExternalOfPatient(patient: Patient){
        if(patient != null){
            this.validateEMRAndGeneralMedicineTestExistence(patient);
        }else{
            this.initilize();
        }   
    }

    receiveOutputExternalOfCurrentHealthPlan(currentHealthPlan: Catalog){
        this.currentHealthPlan = currentHealthPlan;
        this._logger.warn("ReceiveOutput currentHealthPlan="+JSON.stringify(this.currentHealthPlan));   
    }

    validateEMRAndGeneralMedicineTestExistence(patient: Patient){
        this._logger.warn("===== Calling EMR API: getEmrByHealthPlanIdAndPatientCode(" + this.currentHealthPlan.secondaryId 
                    + ", " + patient.code + ") =====");
        this._emrService.getEmrByHealthPlanIdAndPatientCode(this.currentHealthPlan.secondaryId, patient.code)
            .subscribe( (emr: Emr) => {
                if (emr != null){
                    this.emrUpdated = emr;
                    this._logger.warn("EMR already registered");
                    this._logger.warn("===== Calling GeneralMedicineTest API: getGeneralMedicineTestByHealthPlanIdAndPatientCode("
                            + this.currentHealthPlan.secondaryId + ", " + patient.code + ") =====");
                    this._generalMedicineTestService
                        .getGeneralMedicineTestByHealthPlanIdAndPatientCode(emr.healthPlanId, emr.patientCode)
                        .subscribe( (generalMedicineTest: GeneralMedicineTest) => {
                            if(generalMedicineTest != null){
                                this._logger.warn("GeneralMedicineTest already registered");
                                this.generalMedicineTest.setFieldsDetail(generalMedicineTest);
                                this.generalMedicineTest.completeFields(this.symptomTypeItemList);
                                this.generalMedicineTest.isPatientOfMaleGender = 
                                    Utils.isMaleGender(patient.gender, this.genderItemList[0].toString());
                                this._commonService.notifyFindPacientComponent(
                                    //sending signal for write other patient code
                                    {initilizePatientCode:patient.code 
                                    , initilizePatient: patient, initilizeIsActive:false});
                            }else{
                                this._logger.warn("GeneralMedicineTest is not registered yet");
                                this.isGeneralMedicineTestRegistered = false;
                                this.generalMedicineTest = new GeneralMedicineTest();
                                this.generalMedicineTest.emrHealthPlanId = this.currentHealthPlan.secondaryId;
                                this.generalMedicineTest.emrPatientCode = patient.code;
                                this.generalMedicineTest.isPatientOfMaleGender = 
                                    Utils.isMaleGender(patient.gender, this.genderItemList[0].toString());
                            }
                            this._commonService.notifyMedicalTestProcessComponent(
                                    //sending signal for get process table
                                    {patientCode: patient.code 
                                    , healthPlanId: this.currentHealthPlan.secondaryId
                                    , testTypeId: this.generalMedicineItem.secondaryId});
                        }, error => this.errorMessage = <any> error);                        
                }else{
                    this._logger.warn("EMR doesn't be registered yet, should register EMR for this patient");
                }
            }, error => this.errorMessage = <any> error);
    }

    registerGeneralMedicineTest(isFormValided : boolean){
        this.isFieldDisabled = true;
        if(isFormValided){
            this._logger.warn("===== Calling GeneralMedicineTest API: registerGeneralMedicineTest()");
            this._logger.warn("INPUT => GeneralMedicineTest: "+JSON.stringify(this.generalMedicineTest));
            this._generalMedicineTestService.registerGeneralMedicineTest(this.generalMedicineTest)
                .subscribe(test => {
                    this._logger.warn("*****GeneralMedicineTest registered successful*****");
                    this._logger.warn("===== Calling EMR API: validateEmrState()");
                    this._logger.warn("INPUT => emrUpdated: "+JSON.stringify(this.emrUpdated));
                    this._emrService.validateEmrState(this.generalMedicineItem.secondaryId
                        ,this.emrUpdated).subscribe( (emr: Emr )=> {
                            this._logger.warn("*****EMR state valid successful*****");
                            this.initilize();
                        }, error => this.errorMessage = <any> error);
                }, error => this.errorMessage = <any> error);
        }
    }

    initilize(){        
        this.isGeneralMedicineTestRegistered = true;
        this.isFieldDisabled = false;
        this.errorMessage = null;
        this.generalMedicineTest = new GeneralMedicineTest();
        this.emrUpdated = new Emr();
        this.symptom = new Symptom();
        this.initilizeChildComponents();
    }

    private initilizeChildComponents(){
        this._commonService.notifyFindPacientComponent({initilizePatientCode:null
            , initilizePatient: new Patient(), initilizeIsActive:false});
        this._commonService.notifyMedicalTestProcessComponent(
            //sending signal for get process table
            {patientCode: null 
            , healthPlanId: null
            , testTypeId: null});
    }

    //Find value item selected
    private _findValueSelected(){
        let symptom = this.symptomTypeItemList.find(item => item.secondaryId == this.symptom.typeId);
        this.symptom.typeName = symptom.name;
    }

    private _addSymptom(){
        this.symptom.formattedDate = Utils.formatHourDate(this.symptom.appointment);
        this._logger.warn("Adding symptom=>"+JSON.stringify(this.symptom));
        this.generalMedicineTest.symptoms.push(this.symptom);
    }
    
    private _editSymptom(){
        this.generalMedicineTest.symptoms[this.symptom.indexForEdit].setFieldsDetail(this.symptom);
        this.symptom.indexForEdit = null;
    }
}