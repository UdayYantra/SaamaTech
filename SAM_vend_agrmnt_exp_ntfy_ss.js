/**
 * 
 * @NApiVersion 2.x
 * @NScriptType Scheduledscript
 * 
 */

 define(['N/search', 'N/runtime', 'N/task', 'N/record', 'N/email'], function(search, runtime, task, record, email) {

    function execute(context) {

        log.debug({title: 'Invocation Type', details: context.type});

        var filterArr = [];
        var columnArr = [];

        filterArr.push(search.createFilter({name: 'formulanumeric', operator: search.Operator.EQUALTO, values: 0, formula: 'CASE WHEN (TO_DATE(({custrecord_sam_ve_endt} - {custrecord_sam_ve_exprnt})) - TO_DATE({today})) = 0 THEN 0 ELSE 1 END'}));
        filterArr.push(search.createFilter({name: 'custrecord_sam_ve_ntfed', operator: search.Operator.IS, values: false}));

        columnArr.push(search.createColumn({name: 'custrecord_sam_ve_vend'}));
        columnArr.push(search.createColumn({name: 'companyname', join: 'custrecord_sam_ve_vend'}));
        columnArr.push(search.createColumn({name: 'custrecord_sam_ve_title'}));
        columnArr.push(search.createColumn({name: 'custrecord_sam_ve_desc'})); 
        columnArr.push(search.createColumn({name: 'custrecord_sam_ve_stdt'})); 
        columnArr.push(search.createColumn({name: 'custrecord_sam_ve_endt'}));
        columnArr.push(search.createColumn({name: 'internalid'}));

        var vendAgreementSearch = search.create({type: 'customrecord_sam_vend_agrment', filters: filterArr, columns: columnArr});

        var searchCount = vendAgreementSearch.runPaged().count;
        log.debug({title: 'searchCount', details: searchCount});
        if(Number(searchCount) > 0) {
            var rescheduleFlag = false;
            vendAgreementSearch.run().each(function(result) {

                var vendorId    = result.getValue({name: 'custrecord_sam_ve_vend'});
                var vendorName  = result.getValue({name: 'companyname', join: 'custrecord_sam_ve_vend'});
                var agrTitle    = result.getValue({name: 'custrecord_sam_ve_title'});
                var agrDescp    = result.getValue({name: 'custrecord_sam_ve_desc'});
                var agrStrDt    = result.getValue({name: 'custrecord_sam_ve_stdt'});
                var agrEndDt    = result.getValue({name: 'custrecord_sam_ve_endt'});
                var agrIntId    = result.getValue({name: 'internalid'});

                _sendEmailToVendor(vendorId, vendorName, agrTitle, agrDescp, agrStrDt, agrEndDt, agrIntId);
                
                _retriggerScheduleInUsageExcess(rescheduleFlag);

                return true;
            });

            if(rescheduleFlag) {
                var taskObj = taks.create({taskType: task.TaskType.SCHEDULED_SCRIPT, scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId});
                taskObj.submit();
            }
            
        }

    }//function execute(context)

    function _sendEmailToVendor(vendorId, vendorName, agrTitle, agrDescp, agrStrDt, agrEndDt, agrIntId) {

        var recipent        = vendorId;
        var userName        = "Vendor";
        var subjectString   = "Agreement Expiry Notification.";
        var bodyString      = "";

        if(vendorName) {
            userName = vendorName;
        }

        bodyString += "Hello "+vendorName+",";
        bodyString += "<br/><br/>";
        bodyString += "This letter is inform you that your agreement <font color=\"blue\"><b>"+agrTitle+"</b></font> with Saama Technologies will end as of "+agrEndDt+".";
        
        bodyString += "This letter serves as a reminder that your contract <font color=\"blue\"><b>"+agrTitle+"</b></font> with us is expiring as indicated in our original";
        bodyString += "contract bearing number XXXXX which will end on <font color=\"blue\"><b>"+agrEndDt+"</b></font>. It’s been our pleasure to work with";
        bodyString += "you on <font color=\"blue\"><b>"+agrDescp+"</b></font>.<br/>";

        bodyString += "<br/><br/>";
        bodyString += "     <table>";
        bodyString += "         <tr><td>Agreement Title</td><td>:</td><td>"+agrTitle+"</td></tr>";
        bodyString += "         <tr><td>Agreement Description: </td><td>:</td><td>"+agrDescp+"</td></tr>";
        bodyString += "         <tr><td>Agreement Start Date</td><td>:</td><td>"+agrStrDt+"</td></tr>";
        bodyString += "         <tr><td>Agreement End Date</td><td>:</td><td>"+agrEndDt+"</td></tr>";
        bodyString += "     </table>";
        bodyString += "<br/>";
        bodyString += "Please visit office for further details.";
        bodyString += "<br/><br/>";
        bodyString += "Thank you<br/>";
        bodyString += "Admin.<br/>";
        bodyString += "Saama Technologies.";

        email.send({
            author: 63025,
            recipients: vendorId,
            subject: subjectString,
            body: bodyString,
            relatedRecords: {entityId: Number(vendorId)}
        });

        record.submitFields({type: 'customrecord_sam_vend_agrment', id: agrIntId, values: {custrecord_sam_ve_ntfed: true}});
    }//function _sendEmailToVendor(vendorId, vendorName, agrTitle, agrDescp, agrStrDt, agrEndDt, agrIntId)

    function _retriggerScheduleInUsageExcess(rescheduleFlag) {

        var scriptObj   = runtime.getCurrentScript();
        var usageCount  = scriptObj.getRemainingUsage();

        if(Number(usageCount) < 900) {
            rescheduleFlag = true;
            return false;
        }

    }//function _retriggerScheduleInUsageExcess()

    return {
        execute: execute
    }
 });