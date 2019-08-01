/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * File Name: SAM_approve_reject_bill_sl.js
 * Script Name: SAM_Approve_Reject_Bill_SL
 * Company: Saama Tech.
 * Date	Created:	01-Aug-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/

 define(['N/record', 'N/encode', "N/ui/serverWidget", "N/error"], function(record, encode, ui, error) {


    function onRequest(context) {

        log.debug({title:"Reached Here", details: "Reached Here"});
        
        var requestObj = context.request;

        if(requestObj.method == "GET") {
            
            var processFlag = requestObj.parameters['processFlag'];
            var recId = requestObj.parameters['recId'];
            var aprSts = requestObj.parameters['sts'];
            var aprId = requestObj.parameters['aprid'];

            if(!recId || !aprSts || !aprId) {
                throw error.create({name: "MISSING PARAMETERS", message: "You are missing required parameters to proceed. Please contact your administrator for more details."});
            }
            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';
                        
    
            var billId = getDecodedValue(recId);
            var approvalStatus = getDecodedValue(aprSts);
            var approverId = getDecodedValue(aprId);

            log.debug({title: 'billId', details: billId});
            log.debug({title: 'approvalStatus', details: approvalStatus});
            log.debug({title: 'approverId', details: approverId});

            var recApprovalStatus = '';

            if(billId && approvalStatus) {
                var recObj = record.load({type: 'vendorbill', id: billId});
                recApprovalStatus = recObj.getValue({fieldId: 'approvalstatus'});
            }
    
            if(recApprovalStatus && processFlag == "a") {
                if(Number(recApprovalStatus) == Number(approvalStatus)) {
                    
                    recObj.setValue({fieldId: 'approvalstatus', value: 2});
                    recObj.save();
                    log.debug({title: 'Save success', details: 'Save success'});
                    defaultText = '<center><font size="5" face="arial">You have approved the Vendor Bill. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Approved'});
                }
                else if(Number(recApprovalStatus) == Number(2)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Vendor Bill is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Rejected'});
                }
                else {
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Vendor Bill is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Approved'});
                }
            }
            else if(recApprovalStatus && processFlag == "r") {
                if(Number(recApprovalStatus) == Number(approvalStatus)) {
                    //set checkbox
                    var reasonField = form.addField({id: 'custpage_reason', type: ui.FieldType.TEXTAREA, label: 'Rejection Reason'});
                    reasonField.isMandatory = true;
            
                    var purchaseRequesField      = form.addField({id: 'custpage_po_id', type: ui.FieldType.SELECT, label: 'Vendor Bill', source: 'transaction'});
                    var approverIdField          = form.addField({id: 'custpage_apr_id', type: ui.FieldType.SELECT, label: 'Approver Id', source: 'employee'});
                
                    purchaseRequesField.defaultValue = billId;
                    approverIdField.defaultValue = approverId;
                
                    purchaseRequesField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                    approverIdField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                
                    form.addSubmitButton({label: 'Confirm Reject'});

                }
                else if(Number(recApprovalStatus) == Number(2)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Vendor Bill is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Rejected'});
                }
                else {
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Vendor Bill is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Approved'});
                }
            }
    
            log.debug({title: 'Finished', details: 'Finished'});

            context.response.writePage(form);
            
        }
        else {
            var recId = requestObj.parameters['custpage_po_id'];
            var rejText = requestObj.parameters['custpage_reason'];
            var approverId = requestObj.parameters['custpage_apr_id'];
            
            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';

            if(recId && rejText) {
                var recObj = record.load({type: 'vendorbill', id: recId});
                var recApprovalStatus = recObj.getValue({fieldId: 'approvalstatus'});
                var approverFieldText = '';
                
                    
                if(approverFieldText) {
                    recObj.setValue({fieldId: 'approvalstatus', value: 3});
                }
                
                recObj.setValue({fieldId: 'custbody_sam_rejection_reason', value: rejText});                
                recObj.save();

                defaultText = '<center><font size="5" face="arial">You have rejected the Vendor Bill. Thank you.</font></center>';
                msgFld.defaultValue = defaultText;
            }

            context.response.writePage(form);

        }

        

    }

    
    function getDecodedValue(tempString) {
        
        var decodedValue = encode.convert({
            string: tempString.toString(),
            inputEncoding: encode.Encoding.BASE_64_URL_SAFE,
            outputEncoding: encode.Encoding.UTF_8      
        });

        return decodedValue.toString();
    }

    return {
        onRequest: onRequest
    }

 });