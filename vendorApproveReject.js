/**
 *
 * @NAPiVersion 2.x
 * @NScriptType Suitelet
 *
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
 * Description: Code to accept approve or reject action of vendor request and update vendor accordingly
 *********************************************************** */

define(['N/search', 'N/https', 'N/http', 'N/record', 'N/encode', 'N/ui/serverWidget', 'N/email'],
function(search, https, http, record, encode, ui, email){

	function receiveVendorResponse(context) {
		log.debug('receiveVendorResponse', 'start');
        if(context.request.method == http.Method.GET) {
			var requestObj = context.request;
			var processFlag = requestObj.parameters['processFlag'];
			if(processFlag == "a") {
				var requestId   = requestObj.parameters['recId'];
              	requestId = getDecodedValue(requestId);
				approveGetRequest(requestId, context);
			} else {
				var requestId   = requestObj.parameters['recId'];
              requestId = getDecodedValue(requestId);
				rejectGetRequest(requestId, context);
			}
		} else if(context.request.method == http.Method.POST) {
			var requestId = context.request.parameters['custpage_pr_id'];
          log.debug("requestId", requestId);
			rejectPostRequest(requestId, context);
		}
		log.debug('receiveVendorResponse', 'end');
	}
	
	function approveGetRequest(requestId, context) {
      	var requestObj = context.request;
		var vendor = search.lookupFields({type: 'vendor', id: requestId, columns: ['custentity_yil_vendor_approval_status']});
		var reqStatusId = vendor.custentity_yil_vendor_approval_status;
      log.debug('reqStatusId 1', reqStatusId);
      	reqStatusId = reqStatusId[0].value;
		var proceedFlag = true;
		var form = ui.createForm({title: ' ', hideNavBar: true});
      log.debug('reqStatusId 2', reqStatusId);
		if(reqStatusId != 1) {
			var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '<center><font size="5" face="arial">This Vendor Request is already processed and not in use any more. Thank you.</font></center>';
            //Show Back button
			var formType   = requestObj.parameters['formtype'];
			if(formType) {
				defaultText += '<center><br/><br/><font size="5" face="arial"><a href="/app/common/entity/vendor.nl?id='+requestId+'">View Vendor Request</a></font></center>';
            }
            msgFld.defaultValue = defaultText;
            proceedFlag = false;
		} else if(reqStatusId == 1){
			var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
			 var defaultText = '<center><font size="5" face="arial">This Vendor Request is approved successfully. Thank you.</font></center>';
            //Show Back button
			var formType   = requestObj.parameters['formtype'];
			if(formType) {
				defaultText += '<center><br/><br/><font size="5" face="arial"><a href="/app/common/entity/vendor.nl?id='+requestId+'">View Vendor Request</a></font></center>';
			}
			msgFld.defaultValue = defaultText;
		}
		if(proceedFlag) {
			var rec = record.load({
                	type: "vendor",
                  	id: requestId
            });
			rec.setValue("isinactive", false);
			rec.setValue("custentity_yil_vendor_approval_status", 2);
			rec.save(false, true);
			var vendorName = rec.getValue("entityid");
          	var fromEmail = rec.getValue("custentity_vendor_approver");
			var emailSubject = "Vendor " + vendorName + " has been approved";
			var emailBody = "This Vendor Request is approved successfully. <br/> Thank you.";
			var receipient = rec.getValue("custentity_vendor_created_by");
			if(receipient) {
				var emailObj = email.send({
					author: fromEmail,
					recipients: receipient,
					subject: emailSubject,
					body: emailBody,
					relatedRecords: {entityId: Number(requestId)}
				});
			}
		}
      context.response.writePage(form);
	}
	
	function rejectGetRequest(requestId, context) {
     	var requestObj = context.request;
		var vendor = search.lookupFields({type: 'vendor', id: requestId, columns: ['custentity_yil_vendor_approval_status']});
		var proceedFlag = true;
		var reqStatusId = vendor.custentity_yil_vendor_approval_status;
      	reqStatusId = reqStatusId[0].value;
		var form = ui.createForm({title: ' ', hideNavBar: true});
		if(reqStatusId == 3) {
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '<center><font size="5" face="arial">This Vendor Request is already rejected and not in use any more. Thank you.</font></center>';
                //Show Back button
			var formType   = requestObj.parameters['formtype'];
			if(formType) {
				defaultText += '<center><br/><br/><font size="5" face="arial"><a href="/app/common/entity/vendor.nl?id='+requestId+'">View Vendor Request</a></font></center>';
            }
			msgFld.defaultValue = defaultText;
            proceedFlag = false;
        } else if(reqStatusId == 2) {
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '<center><font size="5" face="arial">This Vendor Request is already approved. Thank you.</font></center>';
			var formType   = requestObj.parameters['formtype'];
			if(formType) {
				defaultText += '<center><br/><br/><font size="5" face="arial"><a href="/app/common/entity/vendor.nl?id='+requestId+'">View Vendor Request</a></font></center>';
            }
            proceedFlag = false;
            msgFld.defaultValue = defaultText;
        }
		if(proceedFlag) {
			var reasonField = form.addField({id: 'custpage_reason', type: ui.FieldType.TEXTAREA, label: 'Rejection Reason'});
			var purchaseRequesField     = form.addField({id: 'custpage_pr_id', type: ui.FieldType.SELECT, label: 'Vendor', source: 'entity'});
			purchaseRequesField.defaultValue = requestId;
			purchaseRequesField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
            reasonField.isMandatory = true;
			form.addSubmitButton({label: 'Confirm Reject'});
		}
		context.response.writePage(form);
	}
	
	function rejectPostRequest (requestId, context) {
      var form = ui.createForm({title: ' ', hideNavBar: true});
      var reasonText  = context.request.parameters['custpage_reason'];
      	var requestObj = context.request;
		var rec = record.load({
           	type: "vendor",
           	id: requestId
        });
		rec.setValue("isinactive", true);
		rec.setValue("custentity_yil_vendor_approval_status", 3);
      	rec.setValue("custentity_yil_vendor__rejection_reason", reasonText);
		rec.save(false, true);
		
		var fromEmail = rec.getValue("custentity_vendor_approver");
		var vendorName = rec.getValue("entityid");
		var emailSubject = "Vendor " + vendorName + " has been rejected";
		var emailBody = "This Vendor Request is rejected successfully. <br/> Reject Reason: "+ reasonText +" <br/><br/> Thank you.";
		var receipient = rec.getValue("custentity_vendor_created_by");
		if(receipient) {
			var emailObj = email.send({
				author: fromEmail,
				recipients: receipient,
				subject: emailSubject,
				body: emailBody,
				relatedRecords: {entityId: Number(requestId)}
			});
		}
		var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
			var defaultText = '<center><font size="5" face="arial">This Vendor Request is rejected successfully. Thank you.</font></center>';
			var formType   = requestObj.parameters['formtype'];
			if(formType) {
				defaultText += '<center><br/><br/><font size="5" face="arial"><a href="/app/common/entity/vendor.nl?id='+requestId+'">View Vendor</a></font></center>';
            }
		msgFld.defaultValue = defaultText;
		context.response.writePage(form);
	}
	
	function getDecodedValue(tempString) {
        var decodedValue = encode.convert({
            string: tempString.toString(),
            inputEncoding: encode.Encoding.BASE_64_URL_SAFE,
            outputEncoding: encode.Encoding.UTF_8      
        });
        return decodedValue.toString();
    }
	return{
	onRequest: receiveVendorResponse
	}
});