/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope SameAccount
 * File Name: SAM_approve_reject_email_bill_wa.js
 * Script Name: SAM_ApproveRejectEmail_Bill_WA
 * Company: Saama Tech. 
 * Date	Created:	30-July-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/
define(['N/record', 'N/url', 'N/email', 'N/search', 'N/encode'], function(record, url, email, search, encode) {

    function onAction(context) {

        var recordObj = context.newRecord;

        if(recordObj) {

            _pendingBillApprovalEmailTemplate(recordObj);

        }
        

    }

    
    function _pendingBillApprovalEmailTemplate(recordObj) {

        var requisitionTable = _getItemAndExpenseTable(recordObj);
        var suiteletURL = url.resolveScript({scriptId: 'customscript_sam_apr_rej_po_sl', deploymentId: 'customdeploy_sam_apr_rej_po_sl', returnExternalUrl: true});
        
        var tranIdText = '', nextApproverId = '', nextApproverNm = '', approverRole = '', approverStatusId  = '', requestorName = '', totalAmount = '', departnmentName = '', className = '';
        
            tranIdText = recordObj.getValue({fieldId: 'tranid'});
            nextApproverId = recordObj.getValue({fieldId: 'custbody_sm_next_approver_role'});
            nextApproverNm = recordObj.getText({fieldId: 'custbody_sm_next_approver_role'});
            //approverRole = recordObj.getValue({fieldId: 'custbody_sm_next_approver_role'});
            approverStatusId = recordObj.getValue({fieldId: 'custbody_sm_approval_status'});
            requestorName = recordObj.getText({fieldId: 'entity'});
            totalAmount = recordObj.getValue({fieldId: 'total'});
            departnmentName = recordObj.getText({fieldId: 'department'});
            className = recordObj.getText({fieldId: 'class'});
            totalAmount = Number(totalAmount).toFixed(2);

            log.debug({title: 'approverStatusId', details: approverStatusId});
            log.debug({title: 'approverRole', details: approverRole});

        var emailSubject = "PO #"+tranIdText + " has been submitted for your approval.";
        
        var allApproverArr = [];
        var approverIdArr = [nextApproverId];
        var approverNameArr = [nextApproverNm];

        /*allApproverArr = _getApproverIdsByRole(approverRole);


        log.debug({title: 'allApproverArr', details: allApproverArr});
        if(allApproverArr.length > 0) {
            approverIdArr = allApproverArr[0];
            approverNameArr = allApproverArr[1];

        }*/

        log.debug({title: 'approverIdArr', details: approverIdArr});

        if(approverIdArr.length > 0) {

            for(var a=0;a<approverIdArr.length;a++) {
                
                var bodyString = "";
                var approverId = approverIdArr[a];
                var approverName = approverNameArr[a];
                log.debug({title: 'approver ID & Approver Name', details: approverId +" - & - "+ approverName});
                var emailToId = approverId;
                var userName = 'User';
                if(approverName) {
                    userName = approverName;
                }

                var approveURLParam = suiteletURL + '&processFlag=a&recId='+getEncodedValue(recordObj.id)+'&sts='+getEncodedValue(approverStatusId)+'&aprid='+getEncodedValue(approverId);
                var rejectURLParam = suiteletURL + '&processFlag=r&recId='+getEncodedValue(recordObj.id)+'&sts='+getEncodedValue(approverStatusId)+'&aprid='+getEncodedValue(approverId);

                bodyString += " <html>";
                bodyString += "     <body>";
                bodyString += "         Dear "+userName+",<br/><br/>You have received a new Purchase Order for approval.";
                bodyString += "         <br/><br/>";
                
                bodyString += "         <table>";
                bodyString += "         <tr><td>PO Number</td><td>:</td><td>"+tranIdText+"</td></tr>";
                bodyString += "         <tr><td>Requester</td><td>:</td><td>"+requestorName+"</td></tr>";
                bodyString += "         <tr><td>Total Amount</td><td>:</td><td>"+totalAmount+"</td></tr>";
                bodyString += "         <tr><td>Department</td><td>:</td><td>"+departnmentName+"</td></tr>";
                bodyString += "         <tr><td>Class</td><td>:</td><td>"+className+"</td></tr>";
                bodyString += "         </table>";
                bodyString += "         <br/><br/>";
                bodyString += requisitionTable;

                //bodyString += "         Attached PDF is snapshot of PR.<br/>";
                bodyString += "         Please use below buttons to either <i><b>Approve</b></i> or <i><b>Reject</b></i> PO.";
                bodyString += "         <br/><br/>";
                bodyString += "         <b>Note:</b> Upon rejection system will ask for 'Reason for Rejection'.";

                bodyString += "         <br/><br/>";

                bodyString += "         <a href='"+approveURLParam+"'><img src='http://shopping.na0.netsuite.com/core/media/media.nl?id=27642&c=1047008_SB1&h=c973045d97f452871806' border='0' alt='Accept' style='width: 60px;'/></a>";
                bodyString += "         <a href='"+rejectURLParam+"'><img src='http://shopping.na0.netsuite.com/core/media/media.nl?id=27643&c=1047008_SB1&h=5b07dc4058a53661c171' border='0' alt='Reject' style='width: 60px;'/></a>";
                bodyString += "         <br/><br/>Thank you<br/>Admin";
                bodyString += "     </body>";
                bodyString += " </html>";
                
                var emailObj = email.send({
                    author: 63025,
                    recipients: emailToId,
                    subject: emailSubject,
                    body: bodyString,
                    relatedRecords: {transactionId: Number(recordObj.id)}
                });

            }//for(var a=0;a<approverId.length;a++)

        }
        
    }

    function _getItemAndExpenseTable(recordObj) {
        
        var prItemTableString = "";
        var itemTotalAmount = 0.00;
        var expenseTotalAmount = 0.00;

        var itemLineCount = recordObj.getLineCount({sublistId: 'item'});
        if(Number(itemLineCount) > 0) {
            prItemTableString += "<p><h2>Items:</h2></p>";
            prItemTableString += "<table border= '1' cellspacing='0' cellpadding='5'>";
                prItemTableString += "<tr>";
                    prItemTableString += "  <th><center><b>Sr.No.</b></center></th>";
                    prItemTableString += "  <th><center><b>Item</b></center></th>";
                    prItemTableString += "  <th><center><b>Department</b></center></th>";
                    prItemTableString += "  <th><center><b>Class</b></center></th>";
                    prItemTableString += "  <th><center><b>Quantity</b></center></th>";
                    prItemTableString += "  <th><center><b>Rate</b></center></th>";
                    prItemTableString += "  <th><center><b>Amount</b></center></th>";
                prItemTableString += "</tr>";

                for(var it=0;it<itemLineCount;it++) {
                    
                    var srNo = Number(it) + 1;
                    var itemName        = recordObj.getSublistText({sublistId: 'item', fieldId: 'item', line: it});
                    var lnDepartmentNam = recordObj.getSublistText({sublistId: 'item', fieldId: 'department', line: it});
                    var lnClassNm       = recordObj.getSublistText({sublistId: 'item', fieldId: 'class', line: it});
                    var itemQty         = recordObj.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: it});
                    var itemRate        = recordObj.getSublistValue({sublistId: 'item', fieldId: 'rate', line: it});
                    var itemAmt         = recordObj.getSublistValue({sublistId: 'item', fieldId: 'amount', line: it});
                    itemRate = Number(itemRate).toFixed(2);
                    itemAmt = Number(itemAmt).toFixed(2);
                    itemTotalAmount = Number(itemTotalAmount) + Number(itemAmt);

                    prItemTableString += "<tr>";
                        prItemTableString += "  <td align=\"center\">"+srNo+"</td>";
                        prItemTableString += "  <td align=\"left\">"+itemName+"</td>";
                        prItemTableString += "  <td align=\"lett\">"+lnDepartmentNam+"</td>";
                        prItemTableString += "  <td align=\"left\">"+lnClassNm+"</td>";
                        prItemTableString += "  <td align=\"center\">"+itemQty+"</td>";
                        prItemTableString += "  <td align=\"right\">"+itemRate+"</td>";
                        prItemTableString += "  <td align=\"right\">"+itemAmt+"</td>";
                    prItemTableString += "</tr>";

                }//for(var it=0;it<itemLineCount;it++)

                itemTotalAmount = Number(itemTotalAmount).toFixed(2);

                prItemTableString += "<tr>";
                    prItemTableString += "  <td align=\"right\" colspan=\"6\"><b>Total</b></td>";
                    prItemTableString += "  <td align=\"right\"><b>"+itemTotalAmount+"</b></td>";
                prItemTableString += "</tr>";
            prItemTableString += "</table>";
        }//if(Number(itemLineCount) > 0)

        
        
        return prItemTableString;
    }

    function _getApproverIdsByRole(approverRole) {
        var allArr = [];
        if(approverRole) {
            var empIdsArr = [];
            var empNameArr = [];
            var empSerFilters = [];
            var empSerColumns = [];
    
            empSerFilters.push(search.createFilter({name: 'role', operator: search.Operator.ANYOF, values: approverRole}));
            empSerColumns.push(search.createColumn({name: 'internalid'}));
            empSerColumns.push(search.createColumn({name: 'firstname'}));
    
            var empSearch = search.create({type: search.Type.EMPLOYEE, filters: empSerFilters, columns: empSerColumns});
            log.debug({title: 'employee search length', details: empSearch.runPaged().count});
            if(Number(empSearch.runPaged().count) > 0) {
                empSearch.run().each(function(result) {
                    empIdsArr.push(result.getValue({name: 'internalid'}));
                    empNameArr.push((result.getValue({name: 'firstname'}).toString()).replace(/,/g, ""));
                    return true;
                });
            }
    
            allArr =  [empIdsArr, empNameArr];
        }

        return allArr;

    }

    function getEncodedValue(tempString) {
        var encodedValue = encode.convert({
            string: tempString.toString(),
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64_URL_SAFE        
        });

        return encodedValue.toString();
    }

    return {
        onAction: onAction
    }
});