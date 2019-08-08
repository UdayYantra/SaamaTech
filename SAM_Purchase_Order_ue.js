/** 
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
 */

/*************************************************************
 * File Header
 * Script Type: USER EVENT
 * Script Name: SAM_Purchase_Order_UE
 * File Name: SAM_purchase_order_ue.js
 * Created On: 08-08-2019
 * Modified On:
 * Created By: Udaykumar Patil(Yantra Inc.)
 * Modified By: 
 * Description: This scipt is used to,
 * 				1. Set PR Approval matrix based on subsidiary.
 * 				2. 
 *********************************************************** */

 define(['N/record', 'N/search'], function(record, search) {

    function afterSubmitFun(context) {

        if(context.type == context.UserEventType.DELETE) {
            return true;
        }

        var recType = context.newRecord.type;
        var recId   = context.newRecord.id;
        
        //log.debug({title: 'recType', details: recType});
        //log.debug({title: 'recId', details: recId});

        var recObj = record.load({type: recType, id: recId});

        if(recObj) {

            var prApprovalMatrix    = recObj.getValue({fieldId: 'custbody_po_approval_matrix'});
            var subsidiaryId        = recObj.getValue({fieldId: 'subsidiary'});
    
            //log.debug({title: 'prApprovalMatrix', details: prApprovalMatrix});
            //log.debug({title: 'subsidiaryId', details: subsidiaryId});

            if(!prApprovalMatrix && subsidiaryId) {
                var filterArr = [];
                var columnArr = [];
                filterArr.push(search.createFilter({name: 'custrecord_sm_subsidiary', operator: search.Operator.ANYOF, values: subsidiaryId}));
                columnArr.push(search.createColumn({name: 'internalid'}));
                var poMatrixSearchRes = search.create({type: 'customrecord_po_approval_matrix', filters: filterArr, columns: columnArr})
                if(Number(poMatrixSearchRes.runPaged().count) > 0) {
                    poMatrixSearchRes.run().each(function(result) {
                        recObj.setValue({fieldId: 'custbody_po_approval_matrix', value: result.getValue({name: 'internalid'})});
                        return false;
                    });
                }
            }
            recObj.save();
        }

        


    }

    return {
        afterSubmit: afterSubmitFun
    }
 });