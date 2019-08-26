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

    function beforeSubmit(context) {

        var recObj = context.newRecord;

        var itemLineCount = recObj.getLineCount({sublistId: 'item'});
        

        if(Number(itemLineCount) > 0) {
            for(var i=0;i<itemLineCount;i++) {
                var contractId = recObj.getSublistValue({sublistId: 'item', fieldId: 'purchasecontract', line: i});
                var reasonString = recObj.getSublistValue({sublistId: 'item', fieldId: 'custcol_sam_resn_not_sel_low_qout', line: i});

                if(!reasonString && contractId) {
                    var contractRecObj = search.lookupFields({type: 'purchasecontract', id: contractId, columns: ['custbody_sam_resn_not_sel_low_qout']});
                    //log.debug({title: 'contractRecObj', details: contractRecObj});
                    if(contractRecObj.custbody_sam_resn_not_sel_low_qout) {
                        recObj.setSublistValue({sublistId: 'item', fieldId: 'custcol_sam_resn_not_sel_low_qout', line: i, value: contractRecObj.custbody_sam_resn_not_sel_low_qout})
                    }
                }
            }
        }

    }

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
            var departmentId        = recObj.getValue({fieldId: 'department'});
    
            //log.debug({title: 'prApprovalMatrix', details: prApprovalMatrix});
            //log.debug({title: 'subsidiaryId', details: subsidiaryId});

            if(!prApprovalMatrix && departmentId) {
                var filterArr = [];
                var columnArr = [];
                filterArr.push(search.createFilter({name: 'custrecord_sm_department', operator: search.Operator.ANYOF, values: departmentId}));
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
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmitFun
    }
 });