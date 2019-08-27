/**
 * 
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * 
 */

 define(['N/record', 'N/search'], function(record, search) {

    function afterSubmitFun(context) {

        if(context.type == context.UserEventType.DELETE) {
            return true;
        }
        
        var recType = context.newRecord.type;
        var recId = context.newRecord.id;
        var recObj = record.load({type: recType, id: recId});

        var itemLineCount = recObj.getLineCount({sublistId: 'item'});
        var reasonString = recObj.getValue({fieldId: 'custbody_sam_resn_not_sel_low_qout'});
        log.debug({title: 'Hello', details: itemLineCount});
        log.debug({title: 'reasonString', details: reasonString});
        if(Number(itemLineCount) > 0) {
            for(var i=0;i<itemLineCount;i++) {
                var requestQuoteId = recObj.getSublistValue({sublistId: 'item', fieldId: 'createdfrom', line: i});
                log.debug({title: 'requestQuoteId', details: requestQuoteId});
                if(!reasonString && requestQuoteId) {
                    var reqestQuoteObj = search.lookupFields({type: 'requestforquote', id: requestQuoteId, columns: ['custbody_sam_resn_not_sel_low_qout']});
                    
                    if(reqestQuoteObj.custbody_sam_resn_not_sel_low_qout) {
                        log.debug({title: 'reqestQuoteObj', details: reqestQuoteObj.custbody_sam_resn_not_sel_low_qout});
                        recObj.setValue({fieldId: 'custbody_sam_resn_not_sel_low_qout', value: reqestQuoteObj.custbody_sam_resn_not_sel_low_qout});
                    }
                }
            }
        }

        recObj.save();
    }

    return {
        afterSubmit: afterSubmitFun
    }

 });