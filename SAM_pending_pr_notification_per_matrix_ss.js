/******************************************************
 * @NApiVersion 2.x
 * @NScriptType Scheduledscript
 * File Name: SAM_pending_pr_notification_per_matrix_ss.js
 * File ID: 
 * Company : Saama Technology
 * Date Created: 25-july-2019
 * Date Modified: 
 * Description: This script is used to:
 *              1) Search PR Pending Approval Matrix and fetch due days from submitted for approval.
 *              2) Based on due date script will search the Purchase Requisition and generate mail to send to respective PR Approver.
 *              
*******************************************************/

define(['N/search', 'N/runtime', 'N/task'], function(search, runtime, task) {

    function execute(context) {

        log.debug({title: "Invocation Type", details: context.type});
        var flagVal = '';
        var rescheduledFlag = false;

        var scriptObj = runtime.getCurrentScript()
        flagVal = scriptObj.getParameter({name: 'custscript_sam_aprval_lvl_flag'});
        if(!flagVal) {
            flagVal = 1;
        }
        var prPendAprMatrixFilterArr = [];
        var prPendAprMatrixColumnArr = [];
        
        prPendAprMatrixFilterArr.push(search.create({name: 'custrecord_sam_prrpa_apr_lvl', operator: search.Operator.ANYOF, values: flagVal}));
        prPendAprMatrixFilterArr.push(search.create({name: 'isinactive', operator: search.Operator.IS, values: FALSE}));
        prPendAprMatrixColumnArr.push(search.create({name: 'custrecord_sam_prrpa_days'}));

        var prPendAprMatrixSearchRes = search.create({type: 'customrecord_sam_pr_peapr_remd', filters: prPendAprMatrixFilterArr, columns: prPendAprMatrixColumnArr});

        var prPendingApprovalMatrixCount = prPendAprMatrixSearchRes.runPaged().count;

        if(Number(prPendingApprovalMatrixCount) > 0) {

            prPendAprMatrixSearchRes.run().each(function (result) {

                var days = result.getValue({name: 'custrecord_sam_prrpa_days'});

                _getPendingPRDetailsAndSendEmail(flagVal, days);
                
                return true;
            });
            
        }//if(Number(prPendAprMatrixSearchRes.runPaged().count) > 0)

        //_retriggerScheduleInUsageExcess(rescheduleFlag);

        if(rescheduleFlag) {
            var taskObj = taks.create({taskType: task.TaskType.SCHEDULED_SCRIPT, scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId});
            taskObj.submit();
        }

        function _retriggerScheduleInUsageExcess(rescheduleFlag) {
            var scriptObj   = runtime.getCurrentScript();
            var usageCount  = scriptObj.getRemainingUsage();
            if(Number(usageCount) < 900) {
                rescheduleFlag = true;
                return false;
            }
        }//function _retriggerScheduleInUsageExcess()

        function _getPendingPRDetailsAndSendEmail(flagVal, days) {
            
            var prApprovalStatus = '';
            var formulaText = "TO_DATE({systemnotes.date}) - TO_DATE(TO_DATE({today})-"+days+")";
            
            if(Number(flagVal) = 1) {
                prApprovalStatus = 2;
            }
            else if(Number(flagVal) == 2) {
                prApprovalStatus = 4;
            }
            else if(Number(flagVal) == 3) {
                prApprovalStatus = 3;
            }

            if(prApprovalStatus) {

                var purchaserequisitionSearchObj = search.create({
                    type: "purchaserequisition",
                    filters:
                    [
                       ["type","anyof","PurchReq"], 
                       "AND", 
                       ["status","anyof","PurchReq:A"], 
                       "AND", 
                       ["custbody_sam_pr_approval_status","anyof",prApprovalStatus], 
                       "AND", 
                       ["systemnotes.oldvalue","startswith","Draft"], 
                       "AND", 
                       ["systemnotes.newvalue","startswith","Pending Department Head Approval"], 
                       "AND", 
                       ["mainline","is","T"], 
                       "AND", 
                       ["formulanumeric:"+formulaText,"equalto","0"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "tranid", label: "Document Number"}),
                       search.createColumn({name: "custbody_sam_pr_approver", label: "PR Approver", sort: search.Sort.ASC}),
                       search.createColumn({name: "date", join: "systemNotes", label: "Date" }),
                       search.createColumn({name: "trandate", label: "Date"})
                    ]
                 });
                 var searchResultCount = purchaserequisitionSearchObj.runPaged().count;
                 log.debug("purchaserequisitionSearchObj result count",searchResultCount);
                 purchaserequisitionSearchObj.run().each(function(result){
                    
                    return true;
                 });
            }
            

        }

    }

    return {
        execute: execute
    }
});