/***********************************************************
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * File Name: SAM_Request_For_Quote_CL.js
 * Script Name: Request for quote form level script.
 * Company: Saama Tech.
 * Date	Created:	19-Aug-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/

 define([], function() {

    function saveRecord(context) {

        var currentRecObj = context.currentRecord;
        var doNotChangeVendor = currentRecObj.getValue({fieldId: 'custbody_do_not_change_vendor'});
        var selectLowestQuote = currentRecObj.getValue({fieldId: 'custbody_sam_select_lowest_quote'});
        var reasonNotLowQuote = currentRecObj.getValue({fieldId: 'custbody_sam_resn_not_sel_low_qout'});
        var awardLineCount = currentRecObj.getLineCount({sublistId: 'award'});
        var isAwardSelected = false;

        if(Number(selectLowestQuote) == 2 && !reasonNotLowQuote) {
            alert('Please enter the reason for not selecting lowest quotation.');
            return false;
        }

        if(Number(awardLineCount) > 0) {
            for(var i=0;i<awardLineCount;i++) {
                var awardSelect = currentRecObj.getSublistValue({sublistId: 'award', fieldId: 'awarded', line: i});
                if(awardSelect) {
                    isAwardSelected = true;
                    break;
                }
            }

            if(isAwardSelected && doNotChangeVendor) {
                if(confirm("Do you want to continue with selected vendor ?\n\nPlease press 'OK' to proceed or 'Cancel' to go back.")) {
                    return true;
                }
                else  {
                    return false;
                }
            }

        }

        return true;
    }

    return {
        saveRecord: saveRecord
    }

 });