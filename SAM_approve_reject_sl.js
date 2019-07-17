/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * File Name: SAM_approve_reject_sl.js
 * Script Name: SAM_Approve_Reject_SL
 * Company: Saama Tech.
 * Date	Created:	10-July-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/

 define(['N/record', 'N/encode', "N/ui/serverWidget", "N/error"], function(record, encode, ui, error) {


    function onRequest(context) {

        log.debug({title:"Reached Here", details: "Reached Here"});
        var requestObj = context.request;
        var processFlag = requestObj.parameters['processFlag'];
        var recId = requestObj.parameters['recId'];
        var aprSt = requestObj.parameters['apr'];

        if(requestObj.method == "GET") {
            
            if(!recId || !aprSt) {
                throw error.create({name: "MISSING PARAMETERS", message: "You are missing required parameters to proceed. Please contact your administrator for more details."});
            }
            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';
                        
    
            var prId = getDecodedValue(recId);
            var aprStus = getDecodedValue(aprSt);
            var recStatus = '';
    
            if(prId && aprStus) {
                var recObj = record.load({type: 'purchaserequisition', id: prId});
                recStatus = recObj.getValue({fieldId: 'custbody_sam_pr_approval_status'});
            }
    
            log.debug({title: 'prId', details: prId});
            log.debug({title: 'aprStus', details: aprStus});
            log.debug({title: 'recStatus', details: recStatus});
    
            if(recStatus && processFlag == "a") {
                if(Number(recStatus) == Number(aprStus)) {
                    //set checkbox
                    recObj.setValue({fieldId: 'custbody_sam_apr_email_flg', value: true});
                    recObj.save();
                    defaultText = '<center><font size="5" face="arial">You have approved the Purchase Request. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Approved'});
                }
                else if(Number(recStatus) == Number(6)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Purchase Request is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Rejected'});
                }
                else {
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Purchase Request is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Approval Process', details: 'Already Approved'});
                }
            }
            else if(recStatus && processFlag == "r") {
                if(Number(recStatus) == Number(aprStus)) {
                    //set checkbox
                    var reasonField = form.addField({id: 'custpage_reason', type: ui.FieldType.TEXTAREA, label: 'Rejection Reason'});
                    reasonField.isMandatory = true;
            
                    var purchaseRequesField          = form.addField({id: 'custpage_pr_id', type: ui.FieldType.SELECT, label: 'Purchase Request', source: 'transaction'});
                
                    purchaseRequesField.defaultValue = prId;
                
                    purchaseRequesField.updateDisplayType({displayType: ui.FieldDisplayType.HIDDEN});
                
                    form.addSubmitButton({label: 'Confirm Reject'});

                }
                else if(Number(recStatus) == Number(6)) {
                    //already rejected
                    defaultText = '<center><font size="5" face="arial">This Purchase Request is already rejected. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Rejected'});
                }
                else {
                    //already approved
                    defaultText = '<center><font size="5" face="arial">This Purchase Request is already approved. Thank you.</font></center>';
                    msgFld.defaultValue = defaultText;
                    log.debug({title: 'Rejection Process', details: 'Already Approved'});
                }
            }
    
            context.response.writePage(form);
            
        }
        else {
            var recId = requestObj.parameters['custpage_pr_id'];
            var rejText = requestObj.parameters['custpage_reason'];
            
            var form = ui.createForm({title: ' ', hideNavBar: true});
            var msgFld = form.addField({id: 'custpage_message', type: ui.FieldType.INLINEHTML, label: ' '});
            var defaultText = '';

            log.debug({title: 'rejText', details: rejText});
            log.debug({title: 'recId', details: recId});

            if(recId && rejText) {
                var recObj = record.load({type: 'purchaserequisition', id: recId});
                recObj.setValue({fieldId: 'custbody_sam_rejection_reason', value: rejText});
                recObj.setValue({fieldId: 'custbody_sam_rej_email_flg', value: true});
                recObj.save();

                defaultText = '<center><font size="5" face="arial">You have rejected the Purchase Request. Thank you.</font></center>';
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