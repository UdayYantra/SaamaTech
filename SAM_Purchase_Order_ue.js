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
        
        log.debug({title: 'itemLineCount', details: itemLineCount})

        if(Number(itemLineCount) > 0) {
            for(var i=0;i<itemLineCount;i++) {
                var contractId = recObj.getSublistValue({sublistId: 'item', fieldId: 'purchasecontract', line: i});
                var reasonString = recObj.getSublistValue({sublistId: 'item', fieldId: 'custcol_sam_resn_not_sel_low_qout', line: i});

                log.debug({title: 'contractId', details: contractId});
                log.debug({title: 'reasonString', details: reasonString});

                if(!reasonString && contractId) {
                    
                    var serFiltersArr = [];
                    var serColumnsArr = [];

                    serFiltersArr.push(search.createFilter({name: 'internalidnumber', operator: search.Operator.EQUALTO, values: Number(contractId)}));
                    serFiltersArr.push(search.createFilter({name: 'mainline', operator: search.Operator.IS, values: false}));

                    serColumnsArr.push(search.createColumn({name: 'custbody_sam_resn_not_sel_low_qout', join: 'createdfrom'}));
                    
                    var contractSeaObj = search.create({type: 'purchasecontract', filters: serFiltersArr, columns: serColumnsArr});

                    log.debug({title: 'contractSeaObj', details: contractSeaObj.runPaged().count});
                    if(Number(contractSeaObj.runPaged().count) > 0) {
                        contractSeaObj.run().each(function(result) {
                            reasonString = result.getValue({name: 'custbody_sam_resn_not_sel_low_qout', join: 'createdfrom'})
                        });
                    }

                    log.debug({title: 'reasonString', details: reasonString});
                    if(reasonString) {
                        recObj.setSublistValue({sublistId: 'item', fieldId: 'custcol_sam_resn_not_sel_low_qout', line: i, value: reasonString});
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