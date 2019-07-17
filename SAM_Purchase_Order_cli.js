/***********************************************************
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * File Name: SAM_Purchase_Order_cli.js
 * Script Name: SAM_Purchase_Order_CL
 * Company: Saama Tech.
 * Date	Created:	16-July-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/
define(['N/search'], function(search) {

    function saveRecord(context) {

        var currRecObj = context.currentRecord;

        var poApprovalMatrix = currRecObj.getValue({fieldId: 'custbody_po_approval_matrix'});
        var subsidiaryId = currRecObj.getValue({fieldId: 'subsidiary'});

        if(!poApprovalMatrix && subsidiaryId) {

            var filterArr = [];
            var columnArr = [];
            filterArr.push(search.createFilter({name: 'custrecord_sm_subsidiary', operator: search.Operator.ANYOF, values: subsidiaryId}));
            columnArr.push(search.createColumn({name: 'internalid'}));
            var poMatrixSearchRes = search.create({type: 'customrecord_po_approval_matrix', filters: filterArr, columns: columnArr})
            if(Number(poMatrixSearchRes.runPaged().count) > 0) {
                poMatrixSearchRes.run().each(function(result) {
                    currRecObj.setValue({fieldId: 'custbody_po_approval_matrix', value: result.getValue({name: 'internalid'})});
                    return false;
                });
            }
            else {
                alert('\'PO Approval Matrix\' is not defined for this subsidiary. Please contact your supervisor for more details.');
                return false;
            }   
        }
        return true;
    }

    return {
        saveRecord: saveRecord
    }
});