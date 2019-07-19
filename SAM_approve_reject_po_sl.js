/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * File Name: SAM_approve_reject_po_sl.js
 * Script Name: SAM_Approve_Reject_PO_SL
 * Company: Saama Tech.
 * Date	Created:	18-July-2019.
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
            var aprRol = requestObj.parameters['aprol'];
            var aprSts = requestObj.parameters['sts'];
            var aprId = requestObj.parameters['aprid'];

            if(!recId || !aprRol || !aprSts || !aprId) {
                throw error.create({name: "MISSING PARAMETERS", message: "You are missing required parameters to proceed. Please contact your administrator for more details."});
            }
            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';
                        
    
            var poId = getDecodedValue(recId);
            var approverRole = getDecodedValue(aprRol);
            var approvalStatus = getDecodedValue(aprSts);
            var approverId = getDecodedValue(aprId);

            var recApprovalStatus = '';

            if(poId && approvalStatus) {
                var recObj = record.load({type: 'purchaseorder', id: poId});
                recApprovalStatus = recObj.getValue({fieldId: 'custbody_sm_approval_status'});
            }
    
            if(recApprovalStatus && processFlag == "a") {
                if(Number(recApprovalStatus) == Number(approvalStatus)) {
                    //set checkbox
                    var approverFieldText = '';
                    
                    if(Number(recApprovalStatus) == Number(2)) {
                        approverFieldText = "custbody_sam_budget_approver";
                    }
                    else if(Number(recApprovalStatus) == Number(3)) {
                        approverFieldText = "custbody_sam_po_one_approver";
                    }
                    else if(Number(recApprovalStatus) == Number(4)) {
                        approverFieldText = "custbody_sam_po_two_approver";
                    }
                    else if(Number(recApprovalStatus) == Number(5)) {
                        approverFieldText = "custbody_sam_st_mgnt_approver";
                    }

                    if(approverFieldText) {
                        recObj.setValue({fieldId: approverFieldText, value: approverId});
                    }
                    recObj.setValue({fieldId: 'custbody_sam_apr_email_flg', value: true});

                    recObj.save();
                    defaultText = '<center><font size="5" face="arial">You have approved the Purchase Order. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Approved'});
                }
                else if(Number(recApprovalStatus) == Number(7)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Purchase Order is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Rejected'});
                }
                else {
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Purchase Order is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Approved'});
                }
            }
            else if(recApprovalStatus && processFlag == "r") {
                if(Number(recApprovalStatus) == Number(approvalStatus)) {
                    //set checkbox
                    var reasonField = form.addField({id: 'custpage_reason', type: ui.FieldType.TEXTAREA, label: 'Rejection Reason'});
                    reasonField.isMandatory = true;
            
                    var purchaseRequesField      = form.addField({id: 'custpage_po_id', type: ui.FieldType.SELECT, label: 'Purchase Order', source: 'transaction'});
                    var approverIdField          = form.addField({id: 'custpage_apr_id', type: ui.FieldType.SELECT, label: 'Approver Id', source: 'employee'});
                
                    purchaseRequesField.defaultValue = poId;
                    approverIdField.defaultValue = approverId;
                
                    purchaseRequesField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                    approverIdField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                
                    form.addSubmitButton({label: 'Confirm Reject'});

                }
                else if(Number(recApprovalStatus) == Number(7)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Purchase Order is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Rejected'});
                }
                else {
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Purchase Order is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Approved'});
                }
            }
    
            context.response.writePage(form);
            
        }
        else {
            var recId = requestObj.parameters['custpage_po_id'];
            var rejText = requestObj.parameters['custpage_reason'];
            var approverId = requestObj.parameters['custpage_apr_id'];
            
            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';

            log.debug({title: 'rejText', details: rejText});
            log.debug({title: 'recId', details: recId});

            if(recId && rejText) {
                var recObj = record.load({type: 'purchaseorder', id: recId});
                var recApprovalStatus = recObj.getValue({fieldId: 'custbody_sm_approval_status'});
                var approverFieldText = '';
                    
                if(Number(recApprovalStatus) == Number(2)) {
                    approverFieldText = "custbody_sam_budget_approver";
                }
                else if(Number(recApprovalStatus) == Number(3)) {
                    approverFieldText = "custbody_sam_po_one_approver";
                }
                else if(Number(recApprovalStatus) == Number(4)) {
                    approverFieldText = "custbody_sam_po_two_approver";
                }
                else if(Number(recApprovalStatus) == Number(5)) {
                    approverFieldText = "custbody_sam_st_mgnt_approver";
                }
                    
                if(approverFieldText) {
                    recObj.setValue({fieldId: approverFieldText, value: approverId});
                }
                
                recObj.setValue({fieldId: 'custbody_sam_rejection_reason', value: rejText});
                recObj.setValue({fieldId: 'custbody_sam_rej_email_flg', value: true});
                
                recObj.save();

                defaultText = '<center><font size="5" face="arial">You have rejected the Purchase Order. Thank you.</font></center>';
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