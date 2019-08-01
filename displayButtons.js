/** 
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
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

define(['N/record','N/https', "N/email", "N/search", "N/runtime", "N/url", "N/encode" ,"N/ui/serverWidget"],
function(recObj, https, email, search, runtime, url, encode, ui){

	function displayButtons(context) {
		var form = context.form;
        var recObj = context.newRecord;
        var recId = recObj.getValue({fieldId: 'id'});
        var status = recObj.getValue({fieldId: 'custentity_yil_vendor_approval_status'});
        var isInactive = recObj.getValue({fieldId: 'isinactive'});
        var userObj = runtime.getCurrentUser();
        var currentUserRole = userObj.role;
        var currentUserId   = userObj.id;
		var employee = runtime.getCurrentScript().getParameter({ name: 'custscript_vendor_approver'});
		
		var approverId = recObj.getValue({fieldId: 'id'});
        log.debug({title: 'Record Id', details: recId});
        log.debug({title: 'Transaction Status', details: status});
        log.debug({title: 'currentUserRole', details: currentUserRole});
        log.debug({title: 'currentUserId', details: currentUserId});
      log.debug({title: 'employee', details: employee});
		
		if(context.type == context.UserEventType.VIEW || context.type == context.UserEventType.EDIT) {
			if(((currentUserId == employee) || currentUserRole === 3) && status == 1 && isInactive) {
              var clientScriptPath = runtime.getCurrentScript().getParameter({ name: 'custscript_client_script_path'});
				form.clientScriptModulePath  = clientScriptPath + "vendorButtonsEvent.js"; // SuiteScripts : Vendor Product
              	//Approver Button
              	var encodedRequestId = getEncodedValue1(recId);
              	log.debug({title:"encodedRequestId", details: encodedRequestId});
				var approvalBtn = form.addButton({id: 'custpage_approve_btn', label: 'Approve', functionName: "approveVendorRequestFlow('"+encodedRequestId+"');"})
				//Reject Button
				var rejectBtn = form.addButton({id: 'custpage_reject_btn', label: 'Reject', functionName: "rejectVendorRequestFlow('"+encodedRequestId+"');"});
              log.debug(" display buttons", "reason condition matched");
			} else {
              log.debug("do not display buttons", "reason condition not matched");
            }
			if(status != 3) {
				var rejectResonFld = form.getField({id: 'custentity_yil_vendor__rejection_reason'});
				if(rejectResonFld) {
					rejectResonFld.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
				}
			}
		}
	}
	function getEncodedValue1(tempString) {
        var encodedValue = encode.convert({
            string: tempString.toString(),
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64_URL_SAFE
        });
        return encodedValue.toString();
    }
    return{
			beforeLoad: displayButtons
		};
});