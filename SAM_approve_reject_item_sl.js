/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * File Name: SAM_approve_reject_item_sl.js
 * Script Name: SAM_Item_Approval_SL
 * Company: Saama Tech.
 * Date	Created:	06-Aug-2019
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
            var recType = requestObj.parameters['recType'];
            var aprId = requestObj.parameters['aprid'];
            var aprSts = requestObj.parameters['aprsts'];

            if(!recId || !recType || !aprId || !aprSts) {
                throw error.create({name: "MISSING PARAMETERS", message: "You are missing required parameters to proceed. Please contact your administrator for more details."});
            }

            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';
                        
    
            var itemId = getDecodedValue(recId);
            var itemType = getDecodedValue(recType);
            var approvalStatus = aprSts;
            var approverId = getDecodedValue(aprId);

            log.debug({title: 'itemId', details: itemId});
            log.debug({title: 'itemType', details: itemType});
            log.debug({title: 'approvalStatus', details: approvalStatus});
            log.debug({title: 'approverId', details: approverId});

            var recApprovalStatus = '';

            if(itemType && itemId) {
                var recObj = record.load({type: itemType, id: itemId});
                recApprovalStatus = recObj.getValue({fieldId: 'custitem_sam_item_approval_status'});
            }
    
            log.debug({title: 'recApprovalStatus & approvalStatus', details: recApprovalStatus +" & "+ approvalStatus});

            if(recApprovalStatus && processFlag == "a") {
                if(Number(recApprovalStatus) == Number(approvalStatus)) {
                    
                    recObj.setValue({fieldId: 'custitem_sam_item_approval_status', value: 2});
                    recObj.setValue({fieldId: 'isinactive', value: false});
                    recObj.save();
                    
                    log.debug({title: 'Save success', details: 'Save success'});
                    defaultText = '<center><font size="5" face="arial">You have approved the Item successfully. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Approved'});
                }
                else if(Number(recApprovalStatus) == Number(3)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Item is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Rejected'});
                }
                else if(Number(recApprovalStatus) == Number(2)) {
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Item is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Approved'});
                }
            }
            else if(recApprovalStatus && processFlag == "r") {
                if(Number(recApprovalStatus) == Number(approvalStatus)) {
                    //set checkbox
                    var reasonField = form.addField({id: 'custpage_reason', type: ui.FieldType.TEXTAREA, label: 'Rejection Reason'});
                    reasonField.isMandatory = true;
            
                    var itemFIeld      = form.addField({id: 'custpage_item_id', type: ui.FieldType.SELECT, label: 'Item', source: 'item'});
                    var itemTypeField      = form.addField({id: 'custpage_item_type', type: ui.FieldType.TEXT, label: 'Item Type'});
                    var approverIdField          = form.addField({id: 'custpage_apr_id', type: ui.FieldType.SELECT, label: 'Approver Id', source: 'employee'});
                
                    itemFIeld.defaultValue = itemId;
                    itemTypeField.defaultValue = itemType;
                    approverIdField.defaultValue = approverId;
                
                    itemFIeld.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                    itemTypeField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                    approverIdField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                
                    form.addSubmitButton({label: 'Confirm Reject'});

                }
                else if(Number(recApprovalStatus) == Number(3)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Item is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Rejected'});
                }
                else if(Number(recApprovalStatus) == Number(2)){
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Item is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Approved'});
                }
            }
    
            log.debug({title: 'Finished', details: 'Finished'});

            context.response.writePage(form);
            
        }
        else {
            var recId = requestObj.parameters['custpage_item_id'];
            var recType = requestObj.parameters['custpage_item_type'];
            var rejText = requestObj.parameters['custpage_reason'];
            var approverId = requestObj.parameters['custpage_apr_id'];
            
            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';

            if(recId && rejText) {
                var recObj = record.load({type: recType, id: recId});
                
                recObj.setValue({fieldId: 'custitem_sam_item_approval_status', value: 3});
                recObj.setValue({fieldId: 'custitem_sam_item_rej_reason', value: rejText});                
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