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

define(['N/search', 'N/runtime', 'N/task', 'N/email', 'N/task'], function(search, runtime, task, email, task) {

    function execute(context) {

        
        var flagVal = '';

        var scriptObj = runtime.getCurrentScript()
        flagVal = scriptObj.getParameter({name: 'custscript_sam_aprval_lvl_flag'});
        
        if(!flagVal) {
            flagVal = 1;
        }
        var prPendAprMatrixFilterArr = [];
        var prPendAprMatrixColumnArr = [];
        
        prPendAprMatrixFilterArr.push(search.createFilter({name: 'custrecord_sam_prrpa_apr_lvl', operator: search.Operator.ANYOF, values: flagVal}));
        prPendAprMatrixFilterArr.push(search.createFilter({name: 'isinactive', operator: search.Operator.IS, values: false}));
        prPendAprMatrixColumnArr.push(search.createColumn({name: 'custrecord_sam_prrpa_days'}));

        var prPendAprMatrixSearchRes = search.create({type: 'customrecord_sam_pr_peapr_remd', filters: prPendAprMatrixFilterArr, columns: prPendAprMatrixColumnArr});

        var prPendingApprovalMatrixCount = prPendAprMatrixSearchRes.runPaged().count;

        if(Number(prPendingApprovalMatrixCount) > 0) {

            prPendAprMatrixSearchRes.run().each(function (result) {

                var days = result.getValue({name: 'custrecord_sam_prrpa_days'});
                var internalId = result.id;

                //log.debug({title: 'internalId & Days', details: internalId + " & " + days});

                _getPendingPRDetailsAndSendEmail(flagVal, days);
                
                return true;
            });
            
        }//if(Number(prPendAprMatrixSearchRes.runPaged().count) > 0)

        if(Number(flagVal) == 1 || Number(flagVal) == 2) {
            if(Number(flagVal) == 1) {
                var nxtFlg = 2;
            }
            else if(Number(flagVal) == 2) {
                var nxtFlg = 3;
            }
            
            var taskObj = task.create({taskType: task.TaskType.SCHEDULED_SCRIPT, scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId, params: {custscript_sam_aprval_lvl_flag: nxtFlg}});
            taskObj.submit();
        }

    }

    function _getPendingPRDetailsAndSendEmail(flagVal, days) {
            
           
        var filterArr = [];

        filterArr.push(["type","anyof","PurchReq"]);
        filterArr.push("AND");
        filterArr.push(["status","anyof","PurchReq:A"]);
        filterArr.push("AND");
        filterArr.push(["mainline","is","T"]);
        

        if(Number(flagVal) == 1) {
            filterArr.push("AND");
            filterArr.push(["custbody_sam_pr_approval_status","anyof","2"]);
            filterArr.push("AND"); 
            filterArr.push(["systemnotes.oldvalue","is","Draft"]);
            filterArr.push("AND");
            filterArr.push(["systemnotes.newvalue","is","Pending Department Owner Approval"]);
        }
        else if(Number(flagVal) == 2) {
            filterArr.push("AND");
            filterArr.push(["custbody_sam_pr_approval_status","anyof","4"]);
            filterArr.push("AND"); 
            filterArr.push(["systemnotes.oldvalue","is","Pending Department Owner Approval"]);
            filterArr.push("AND");
            filterArr.push(["systemnotes.newvalue","is","Pending Subsidiary Owner Approval"]);
        }
        else if(Number(flagVal) == 3) {
            filterArr.push("AND");
            filterArr.push(["custbody_sam_pr_approval_status","anyof","3"]);
            filterArr.push("AND"); 
            filterArr.push(["systemnotes.oldvalue","is","Pending Department Owner Approval"]);
            filterArr.push("AND");
            filterArr.push(["systemnotes.newvalue","is","Pending Finance Owner Approval"]);
        }
        filterArr.push("AND");
        filterArr.push(["formulanumeric: TO_NUMBER(TO_DATE(TO_DATE({today})) - TO_DATE({systemnotes.date}))","equalto",days]);
        //log.debug({title: 'filterArr', details: filterArr});

        if(filterArr.length > 0) {

            var purchaserequisitionSearchObj = search.create({
                type: "purchaserequisition",
                filters: filterArr,
                columns:
                [
                    search.createColumn({name: "internalid"}),
                    search.createColumn({name: "tranid", label: "Document Number"}),
                    search.createColumn({name: "custbody_sam_pr_approver", label: "PR Approver"}),
                    search.createColumn({name: "date",join: "systemNotes",label: "Date"}),
                    search.createColumn({name: "trandate", label: "Date"}),
                    search.createColumn({name: "formulanumeric",formula: "TO_NUMBER(TO_DATE(TO_DATE({today})) - TO_DATE({systemnotes.date}))",label: "Formula (Numeric)"}),
                    search.createColumn({name: "fxamount", label: "Estimated Total"}),
                    search.createColumn({name: "currency", label: "Currency"}),
                    search.createColumn({name: "subsidiarynohierarchy", label: "Subsidiary (no hierarchy)"}),
                    search.createColumn({name: "department", label: "Department"}),
                    search.createColumn({name: "locationnohierarchy", label: "Location (no hierarchy)"}),
                    search.createColumn({name: "custbody_sam_budgetary_status", label: "Budgetary Status"})
                ]
             });
             var searchResultCount = purchaserequisitionSearchObj.runPaged().count;
             //log.debug("purchaserequisitionSearchObj result count",searchResultCount);
             if(Number(searchResultCount) > 0) {
                
                var approverEmailObj = {
                    approverIdsArr: [],
                    approverNmsArr: [],
                    emailBodyTable: [],
                    rowLength: []
                }

                purchaserequisitionSearchObj.run().each(function(prresult){
                
                    var prInternalId        = prresult.getValue({name: 'internalid'});
                    var prTransId           = prresult.getValue({name: 'tranid'});
                    var prApproverId        = prresult.getValue({name: 'custbody_sam_pr_approver'});
                    var prApproverNm        = prresult.getText({name: 'custbody_sam_pr_approver'});
                    var prDate              = prresult.getValue({name: 'trandate'});
                    var prSubmittedDate     = prresult.getValue({name: 'date', join: 'systemNotes'});
                    var prEstimatedTotal    = prresult.getValue({name: 'fxamount'});
                    var prCurrency          = prresult.getText({name: 'currency'});
                    var prSubsidiary        = prresult.getText({name: 'subsidiarynohierarchy'});
                    var prDepartment        = prresult.getText({name: 'department'});
                    var prLocation          = prresult.getText({name: 'locationnohierarchy'});
                    var prBudgetStatus      = prresult.getText({name: 'custbody_sam_budgetary_status'});
                    var prLink              = "";
                    prLink = "<a href='/app/accounting/transactions/purchreq.nl?id="+prInternalId+"'  target='_blank'>"+prTransId+"</a>"
                    var rowString = "";
                    prEstimatedTotal = Number(prEstimatedTotal).toFixed(2);
                    if(approverEmailObj.approverIdsArr.length == 0) {
                        approverEmailObj.approverIdsArr.push(prApproverId);
                        approverEmailObj.approverNmsArr.push(prApproverNm);
                        approverEmailObj.rowLength.push([1]);
                        rowString = "<tr>";
                            rowString += "<td>1</td><td>"+prLink+"</td><td>"+prDate+"</td><td>"+prSubsidiary+"</td><td>"+prDepartment+"</td><td>"+prLocation+"</td><td>"+prCurrency+"</td><td>"+prEstimatedTotal+"</td><td>"+prBudgetStatus+"</td><td>"+prSubmittedDate+"</td>";
                        rowString += "</tr>";
                        approverEmailObj.emailBodyTable.push(rowString);
                    }
                    else {
                        if(approverEmailObj.approverIdsArr.indexOf(prApproverId) < 0) {
                            approverEmailObj.approverIdsArr.push(prApproverId);
                            approverEmailObj.approverNmsArr.push(prApproverNm);
                            approverEmailObj.rowLength.push([1]);
                            rowString = "<tr>";
                                rowString += "<td>1</td><td>"+prLink+"</td><td>"+prDate+"</td><td>"+prSubsidiary+"</td><td>"+prDepartment+"</td><td>"+prLocation+"</td><td>"+prCurrency+"</td><td>"+prEstimatedTotal+"</td><td>"+prBudgetStatus+"</td><td>"+prSubmittedDate+"</td>";
                            rowString += "</tr>";
                            approverEmailObj.emailBodyTable.push(rowString);
                        }
                        else {
                            var index = approverEmailObj.approverIdsArr.indexOf(prApproverId);
                            var rowLen = approverEmailObj.rowLength[index].length;
                            rowLen++;
                            
                            rowString = "<tr>";
                                rowString += "<td>"+rowLen+"</td><td>"+prLink+"</td><td>"+prDate+"</td><td>"+prSubsidiary+"</td><td>"+prDepartment+"</td><td>"+prLocation+"</td><td>"+prCurrency+"</td><td>"+prEstimatedTotal+"</td><td>"+prBudgetStatus+"</td><td>"+prSubmittedDate+"</td>";
                            rowString += "</tr>";
                            approverEmailObj.rowLength[index].push(rowLen);
                            approverEmailObj.emailBodyTable[index] = approverEmailObj.emailBodyTable[index] + rowString;
                        }
                    }

                    return true;
                 });

                 if(approverEmailObj.approverIdsArr.length > 0) {

                    for(var e=0;e<approverEmailObj.approverIdsArr.length;e++) {
                    
                        _sendEmailFunction(days, approverEmailObj.approverIdsArr[e], approverEmailObj.approverNmsArr[e], approverEmailObj.emailBodyTable[e], approverEmailObj.rowLength[e].length);
                        
                    }

                 }
             }
             
        }
        

    }

    function _sendEmailFunction(daysDelay, recipient, recipientNm, bodyTableString, prLength) {
        
        if(!recipientNm) {
            recipientNm = "User";
        }
        log.debug({title: "recipient", details: recipient});
        log.debug({title: "recipientNm", details: recipientNm});
        var subjectText = "Pending PR Approval Notification: PR(s) pending for your approval."
        var bodyString = "";
        bodyString += "<html>";
            bodyString += "<body>";
            bodyString += "Dear "+recipientNm+",";
                bodyString += "<br/><br/>";
                bodyString += "This is to bring to your notice that there "+prLength+" PR(s) pending for your Approval from last "+daysDelay+" days.";
                bodyString += "<br/><br/>";
                    bodyString += "<table border= '1' cellspacing='0' cellpadding='5'>";
                    bodyString += "<tr><th><center><b>Sr. No.</b></center></th><th><center><b>PR Number</b></center></th><th><center><b>Date</b></center></th><th><center><b>Subsidiary</b></center></th><th><center><b>Department</b></center></th><th><center><b>Location</b></center></th><th><center><b>Currency</b></center></th><th><center><b>Estimated Amount</b></center></th><th><center><b>Budgetary Status</b></center></th><th><center><b>Submitted for Approval on</b></center></th></tr>";
                    bodyString += bodyTableString;
                bodyString += "<br/><br/>";
                bodyString += "Thank you<br/>Admin.";

            bodyString += "</body>";
        bodyString += "</html>";

        email.send({
            author: 63025,
            recipients: 63025,
            subject:  subjectText,
            body: bodyString
        });
    }

    return {
        execute: execute
    }
});