/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

/*************************************************************
 * File Header
 * Script Type: NA
 * Script Name: NA
 * File Name: vendorCreate.js
 * Created On: 17/05/2019
 * Modified On: 17/05/2019
 * Created By: Taher Vohra(Yantra Inc.)
 * Modified By: 
 * Description: Code to send email and inactive vendor on create event
 *********************************************************** */

define(['N/record'],
function(recObj){
	function disableInactive(context) {
		var recObj = context.currentRecord;
		var recId = recObj.getValue({fieldId: 'id'});
		var status = recObj.getValue({fieldId: 'custentity_yil_vendor_approval_status'});
		if(status == 1) {
			var inactiveField = recObj.getField('isinactive');
			//inactiveField.isDisabled = true;
			
		}
	}

	function saveRecord(context) {
		var currentRecord = context.currentRecord;
		//alert('here 1');
		if(!currentRecord.getValue({fieldId: 'isinactive'}) && !currentRecord.getValue({fieldId: 'custentity_vendor_approver'})) {
			//alert('here');
			currentRecord.setValue({fieldId: 'custentity_yil_vendor_approval_status', value: 2});
		}
		return true;
	}
	return{
		pageInit: disableInactive,
		saveRecord: saveRecord
	}
});