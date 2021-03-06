import {Catalog} from './catalog';
import * as moment from 'moment';

export class Utils {
    
    static selectItem: Catalog;
    static catalog: Catalog;
    
    static getSelectItemByDefault(){ 
        if(this.selectItem == null){
            this.selectItem =  new Catalog(null,"<SELECCIONE>");
        }
        return this.selectItem; 
    }

    static formatDate(date: Date) { 
        return moment(date).format("DD/MM/YYYY");
    }

    static formatHourDate(date: Date) { 
        return moment(date).format("DD/MM/YYYY HH:mm [h]");
    }

    static createCatalog(secondaryId: number, name: string){
        if(this.catalog == null){
            this.catalog = new Catalog (secondaryId, name);
        }else{
            this.catalog.secondaryId = secondaryId;
            this.catalog.name = name;
        }
        return this.catalog;
    }

    static isMaleGender(gender:string, male:string){
        return gender == male ? true : false;
    }

    static calculateDifferenceInYears(firstDate: Date, secondDate: Date){
        return moment(firstDate).diff(secondDate, 'years');
    }
}