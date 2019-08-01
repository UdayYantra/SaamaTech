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

define(['N/record','N/https', "N/email", "N/search", "N/runtime", "N/url", "N/encode","N/ui/serverWidget"],
function(recObj, https, email, search, runtime, url, encode, ui){
    function getRecord(context){
        log.debug("getRecord function execution started");
        try{
            var record = context.newRecord;
			//fetch id of the record
            var recId = record.id;
			//fetch type of the record
            var recType = record.type;
			//load record
          	var rec = recObj.load({
                	type: recType,
                  	id: recId
            });
			//inactivate the vendor
			var userObj = runtime.getCurrentUser();
       		log.debug("userObj", userObj);
          	inactivateVendor(rec, userObj);
			log.debug("send email", "start");
			//send email to next approver
			sendEmailToApprover(rec, recId, userObj);
			log.debug("send email", "end");
        }
	    catch(e) {
        	log.debug("errorMessage", e.message);
	    }
        log.debug("getRecord function execution ended");
    return true;
}
	function inactivateVendor(record, userObj) {
		//set inactive flag as true; as by default vendor should be inactive
        record.setValue("isinactive", true);
      var employee = runtime.getCurrentScript().getParameter({ name: 'custscript_vendor_approver'});
      	record.setValue("custentity_vendor_approver",employee);
      	record.setValue("custentity_vendor_created_by", userObj.id);
		//save the record
		
		record.save(false, true);
	}
	function sendEmailToApprover(record, recordId, userObj) {
		var employee = runtime.getCurrentScript().getParameter({ name: 'custscript_vendor_approver'});
		log.debug("employee value ",employee);
		var currentScriptId = "customscript_prdt_approve_reject_vendor";
        var currentScriptDeploumentId = "customdeploy_prdt_approve_reject_vendor";
        var suiteletURL = url.resolveScript({scriptId: currentScriptId, deploymentId: currentScriptDeploumentId, returnExternalUrl: true});
		
		var vendorName = record.getValue("entityid");
		var emailSubject = "Vendor "+ vendorName + " has been submitted for your approval.";
		var approveURLParam = suiteletURL + '&processFlag=a&recId='+getEncodedValue(recordId);
        var rejectURLParam = suiteletURL + '&processFlag=r&recId='+getEncodedValue(recordId);

		var userName = 'User';
		var mail = "";
        var empObj = search.lookupFields({type: search.Type.EMPLOYEE, id: employee, columns: ["firstname", "email"]});
        if(empObj) {
            log.debug({title: "empObj", details: JSON.stringify(empObj)});
            userName = empObj.firstname;
			mail = empObj.email;
        }
		var emailBody = createEmailBody(record, approveURLParam, rejectURLParam, userName);
		
		var emailObj = email.send({
                author: userObj.id,
                recipients: mail,
                subject: emailSubject,
                body: emailBody,
                relatedRecords: {entityId: Number(recordId)}
            });
	}
	
	function createEmailBody(record, approveURLParam, rejectURLParam, userName) {
		var approveImageLink = runtime.getCurrentScript().getParameter({ name: 'custscript_approve_image_link'});
        var rejectImageLink = runtime.getCurrentScript().getParameter({ name: 'custscript_reject_image_link'});
		if(userName === '' || userName == null) {
			userName = 'User';
		}
		var companyname = record.getValue("companyname");
		var datecreated = record.getValue("datecreated");
		var subsidiary = record.getText("subsidiary");
		var bodyString = "";
		bodyString += " <html>";
        bodyString += "     <body>";
        bodyString += "         Dear "+userName+",<br/><br/>You have received a new Vendor for approval.";
        bodyString += "         <br/>";
        bodyString += "         <table>";
        bodyString += "         <tr><td>Vendor Name</td><td>:</td><td>"+companyname+"</td></tr>";
        bodyString += "         <tr><td>Subsidiary</td><td>:</td><td>"+subsidiary+"</td></tr>";
        bodyString += "         <tr><td>Created Date and Time</td><td>:</td><td>"+datecreated+"</td></tr>";
        bodyString += "         </table>";
        bodyString += "         <br/><br/>";
        bodyString += "         Please use below buttons to either <i><b>Approve</b></i> or <i><b>Reject</b></i>.";
        bodyString += "         <br/><br/>";
        bodyString += "         <b>Note:</b> Upon rejection please enter 'Reason for Rejection'.";

        bodyString += "         <br/><br/>";
        bodyString += "         <a href='"+approveURLParam+"'><img src='"+approveImageLink+"' border='0' alt='Accept' style='width: 60px;'/></a>";
        bodyString += "         <a href='"+rejectURLParam+"'><img src='"+rejectImageLink+"' border='0' alt='Reject' style='width: 60px;'/></a>";
        bodyString += "         <br/><br/>Thank you<br/>Admin";
        bodyString += "     </body>";
        bodyString += " </html>";
		return bodyString;
	}
	
	function getEncodedValue(tempString) {
        var encodedValue = encode.convert({
            string: tempString.toString(),
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64_URL_SAFE        
        });
        return encodedValue.toString();
    }
	
	function displayGrid(context) {
		var form = context.form;
      	var recObj = context.newRecord;
        var status = recObj.getValue({fieldId: 'custentity_yil_vendor_approval_status'});
      	var employee = runtime.getCurrentScript().getParameter({ name: 'custscript_vendor_approver'});
      	recObj.setValue("custentity_vendor_approver",employee);
      	if(status != 3) {
			var rejectResonFld = form.getField({id: 'custentity_yil_vendor__rejection_reason'});
			if(rejectResonFld) {
				rejectResonFld.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
			}
		}
        //var recObj = context.newRecord;
	}
	
    return{
			afterSubmit: getRecord,
      		beforeLoad: displayGrid
		};
});