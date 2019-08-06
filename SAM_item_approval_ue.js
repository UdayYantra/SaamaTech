/** 
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: USER EVENT
 * Script Name: SAM_Item_Approval_UE
 * File Name: SAM_item_approval_ue.js
 * Created On: 05-08-2019
 * Modified On: 05-08-2019
 * Created By: Udaykumar Patil(Yantra Inc.)
 * Modified By: 
 * Description: This scipt is used to,
 * 				1. Disable Inactivate field.
 * 				2. Set Approval status to pending approval for newly created record and inactivate the same.
 * 				3. Fetch the item approver from general preferences and set in approver field.
 * 				4. Generate an email with approver and reject link to approver.
 *********************************************************** */

define(['N/record','N/https', "N/email", "N/search", "N/runtime", "N/url", "N/encode" ,"N/ui/serverWidget"],
function(record, https, email, search, runtime, url, encode, ui){

	
	function beforeLoadFun(context) {

		var recObj	= context.newRecord;
		var form	= context.form;

		if(context.type == context.UserEventType.VIEW) {
			_showApproveRejectButtons(context, recObj, form);
		}
		else if(context.type == context.UserEventType.EDIT) {
			_disabledInactiveField(context, recObj, form);
		}

	}
	
	function afterSubmitFun(context) {

		if(context.type == context.UserEventType.DELETE) {
			return true;
		}

		var recObj = record.load({type: context.newRecord.type, id: context.newRecord.id});

			if(context.type == context.UserEventType.CREATE) {
				_inactiveAndSendEmailFun(context, recObj);
			}
			else if(context.type == context.UserEventType.EDIT) {
				_setStatusForAlreadyAvailableItems(context, recObj);
			}

		recObj.save();

	}

	function _inactiveAndSendEmailFun(context, recObj) {

		var approverId = runtime.getCurrentScript().getParameter({name: 'custscript_sam_item_approver'});

		log.debug({title: 'approverId', details: approverId});

		if(approverId) {
			
			recObj.setValue({fieldId: 'custitem_sam_item_approver', value: approverId});
			recObj.setValue({fieldId: 'isinactive', value: true});
			recObj.setValue({fieldId: 'custitem_sam_item_approval_status', value: 1});

			_sendEmailToApprover(approverId, recObj);

		}
		else {
			recObj.setValue({fieldId: 'custitem_sam_item_approval_status', value: 2});
		}
	}
	
	function _setStatusForAlreadyAvailableItems(context, recObj) {

		var isInactiveVal = recObj.getValue({fieldId: 'isinactive'});
		var approvalStatus = recObj.getValue({fieldId: 'custitem_sam_item_approval_status'});

		if(!isInactiveVal && (!approvalStatus || Number(approvalStatus) == 1)) {
			recObj.setValue({fieldId: 'custitem_sam_item_approval_status', value: 2});
		}

	}

	function _sendEmailToApprover(approverId, recObj) {

		var emailToId = approverId;
		var userName = 'User';
		var empObj = search.lookupFields({type: search.Type.EMPLOYEE, id: approverId, columns: ['entityid']});
		var suiteletURL = url.resolveScript({scriptId: 'customscript_sam_item_approval_sl', deploymentId: 'customdeploy_sam_item_approval_sl', returnExternalUrl: true});
        
		if(empObj) {
			userName = empObj.entityid;
		}

		var itemCodeNumber		= recObj.getValue({fieldId: "itemid"});
		var itemDisplayName		= recObj.getValue({fieldId: "displayname"});
		var itemUnitType		= recObj.getText({fieldId: "unitstype"});
		var subsidiaryName		= recObj.getText({fieldId: "subsidiary"});
		var locationName		= recObj.getText({fieldId: "location"});
		var itemTypeName		= recObj.getValue({fieldId: "itemtypename"});
		var itemSubType			= recObj.getValue({fieldId: "subtype"});
		var itemDepartment		= recObj.getText({fieldId: "department"});
		var itemClass			= recObj.getText({fieldId: "class"});
		var expenseAcc			= recObj.getText({fieldId: 'expenseaccount'});
		var incomeAcc			= recObj.getText({fieldId: 'incomeaccount'});


		var emailSubject = "Item #"+itemCodeNumber + " has been submitted for your approval.";
        
		var approveURLParam = suiteletURL + '&processFlag=a&recId='+getEncodedValue(recObj.id)+'&recType='+getEncodedValue(recObj.type)+'&aprid='+getEncodedValue(approverId)+'&aprsts=1';
		var rejectURLParam = suiteletURL + '&processFlag=r&recId='+getEncodedValue(recObj.id)+'&recType='+getEncodedValue(recObj.type)+'&aprid='+getEncodedValue(approverId)+'&aprsts=1';
		
		var bodyString = "";
		bodyString += " <html>";
		bodyString += "     <body>";
		bodyString += "         Dear "+userName+",<br/><br/>You have received a new <b>'"+itemTypeName+"'</b> for approval.";
		bodyString += "         <br/><br/>";
		
		bodyString += "         <table>";
		bodyString += "         <tr><td>Item Name/Number</td><td>:</td><td>"+itemCodeNumber+"</td></tr>";
		bodyString += "         <tr><td>Dispaly Name/Number</td><td>:</td><td>"+itemDisplayName+"</td></tr>";
		bodyString += "         <tr><td>Item Unit</td><td>:</td><td>"+itemUnitType+"</td></tr>";
		bodyString += "         <tr><td>Subsidiary</td><td>:</td><td>"+subsidiaryName+"</td></tr>";
		bodyString += "         <tr><td>Location</td><td>:</td><td>"+locationName+"</td></tr>";
		bodyString += "         <tr><td>Department</td><td>:</td><td>"+itemDepartment+"</td></tr>";
		bodyString += "         <tr><td>Class</td><td>:</td><td>"+itemClass+"</td></tr>";
		bodyString += "         <tr><td>Item Type</td><td>:</td><td>"+itemSubType+"</td></tr>";
		if(expenseAcc) {
			bodyString += "         <tr><td>Expense Account</td><td>:</td><td>"+expenseAcc+"</td></tr>";
		}
		
		if(incomeAcc) {
			bodyString += "         <tr><td>Expense Account</td><td>:</td><td>"+incomeAcc+"</td></tr>";
		}

		bodyString += "         </table>";
		bodyString += "         <br/><br/>";

		//bodyString += "         Attached PDF is snapshot of PR.<br/>";
		bodyString += "         Please use below buttons to either <i><b>Approve</b></i> or <i><b>Reject</b></i> the item.";
		bodyString += "         <br/><br/>";
		bodyString += "         <b>Note:</b> Upon rejection system will ask for 'Reason for Rejection'.";

		bodyString += "         <br/><br/>";

		bodyString += "         <a href='"+approveURLParam+"'><img src='https://1047008-sb1.app.netsuite.com/core/media/media.nl?id=27649&c=1047008_SB1&h=3bb666a46dc92674e644&expurl=T' border='0' alt='Accept' style='width: 60px;'/></a>";
		bodyString += "         <a href='"+rejectURLParam+"'><img src='https://1047008-sb1.app.netsuite.com/core/media/media.nl?id=27648&c=1047008_SB1&h=7be970bb7349fc871d41&expurl=T' border='0' alt='Reject' style='width: 60px;'/></a>";
		bodyString += "         <br/><br/>Thank you<br/>Admin";
		bodyString += "     </body>";
		bodyString += " </html>";
		
		var emailObj = email.send({
			author: 63025,
			recipients: emailToId,
			subject: emailSubject,
			body: bodyString
		});

	}

	function getEncodedValue(tempString) {
        var encodedValue = encode.convert({
            string: tempString.toString(),
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64_URL_SAFE
        });
        return encodedValue.toString();
	}
	
	function _disabledInactiveField(context, recObj, form) {

		var approvalStatus	= recObj.getValue({fieldId: 'custitem_sam_item_approval_status'});
		
		if(Number(approvalStatus) == 1 || Number(approvalStatus) == 3) {
			var inactiveFieldObj = form.getField({id: 'isinactive'});
			if(inactiveFieldObj) {
				inactiveFieldObj.updateDisplayType({displayType: ui.FieldDisplayType.DISABLED});
			}
		}
	}

	function _showApproveRejectButtons(context, recObj, form) {
		
		var approvalStatus	= recObj.getValue({fieldId: 'custitem_sam_item_approval_status'});
		var approverId		= recObj.getValue({fieldId: 'custitem_sam_item_approver'});
		var isInactiveVal	= recObj.getValue({fieldId: 'isinactive'});
		var currentUserId	= runtime.getCurrentUser().id;
		
		if(Number(approvalStatus) == 1 && isInactiveVal && Number(approverId) == Number(currentUserId)) {
			
			var suiteletURL = url.resolveScript({scriptId: 'customscript_sam_item_approval_sl', deploymentId: 'customdeploy_sam_item_approval_sl', returnExternalUrl: true});
			
			var approveURLParam	= suiteletURL + '&processFlag=a&recId='+getEncodedValue(recObj.id)+'&recType='+getEncodedValue(recObj.type)+'&aprid='+getEncodedValue(approverId)+'&aprsts=1';
			var rejectURLParam	= suiteletURL + '&processFlag=r&recId='+getEncodedValue(recObj.id)+'&recType='+getEncodedValue(recObj.type)+'&aprid='+getEncodedValue(approverId)+'&aprsts=1';
		
			form.addButton({id: 'custpage_approver_btn', label: 'Approve', functionName: "javascript: window.open('"+approveURLParam+"', '_self');"});
			form.addButton({id: 'custpage_reject_btn', label: 'Reject', functionName: "javascript: window.open('"+rejectURLParam+"', '_self');"});

		}
	}

    return{
		beforeLoad: beforeLoadFun,
		afterSubmit: afterSubmitFun
	};
});



