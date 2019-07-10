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
                log.debug({title: 'Approval Process', details: 'Approved'});
            }
            else if(Number(recStatus) == Number(6)) {
                //already rejected
                defaultText = '<center><font size="5" face="arial">You have already rejected this Purchase Request. Thank you.</font></center>';
                log.debug({title: 'Approval Process', details: 'Already Rejected'});
            }
            else {
                //already approved
                defaultText = '<center><font size="5" face="arial">You have already approved this Purchase Request. Thank you.</font></center>';
                log.debug({title: 'Approval Process', details: 'Already Approved'});
            }
        }
        else if(recStatus && processFlag == "r") {
            if(Number(recStatus) == Number(aprStus)) {
                //set checkbox
                recObj.setValue({fieldId: 'custbody_sam_rej_email_flg', value: true});
                recObj.save();
                defaultText = '<center><font size="5" face="arial">You have rejected the Purchase Request. Thank you.</font></center>';
                log.debug({title: 'Rejection Process', details: 'Rejected'});
            }
            else if(Number(recStatus) == Number(6)) {
                //already rejected
                defaultText = '<center><font size="5" face="arial">You have already rejected this Purchase Request. Thank you.</font></center>';
                log.debug({title: 'Rejection Process', details: 'Already Rejected'});
            }
            else {
                //already approved
                defaultText = '<center><font size="5" face="arial">You have already approved this Purchase Request. Thank you.</font></center>';
                log.debug({title: 'Rejection Process', details: 'Already Approved'});
            }
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

    return {
        onRequest: onRequest
    }

 });