/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope SameAccount
 * File Name: Sam_approve_reject_email_WA.js
 * Script Name: SAM_ApproveRejectEmail_WA
 * Company: Saama Tech. 
 * Date	Created:	10-July-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/
define(['N/record', 'N/encode', "N/url", "N/email"], function(record, encode, url, email) {

    function onAction(context) {

        var recordObj = context.newRecord;

        if(recordObj) {

            _pendingApprovalEmailTemplate(recordObj);

        }

    }

    function _pendingApprovalEmailTemplate(recordObj) {

        var bodyString = "";
        var requisitionTable = _getItemAndExpenseTable(recordObj);
        var suiteletURL = url.resolveScript({scriptId: 'customscript_sam_apr_rej_sl', deploymentId: 'customdeploy_sam_apr_rej_sl', returnExternalUrl: true});
        
        var tranIdText = '', approverName = '', approverId = '', approverStatusId  = '', requestorName = '', departnmentName = '', className = '';
        
            tranIdText = recordObj.getValue({fieldId: 'transactionnumber'});
            approverName = recordObj.getText({fieldId: 'custbody_sam_pr_approver'});
            approverId = recordObj.getValue({fieldId: 'custbody_sam_pr_approver'});
            approverStatusId = recordObj.getValue({fieldId: 'custbody_sam_pr_approval_status'});
            requestorName = recordObj.getText({fieldId: 'entity'});
            totalAmount = recordObj.getValue({fieldId: 'total'});
            departnmentName = recordObj.getText({fieldId: 'department'});
            className = recordObj.getText({fieldId: 'class'});
            totalAmount = Number(totalAmount).toFixed(2);

            log.debug({title: 'approverStatusId', details: approverStatusId});

        var emailSubject = "PR #"+tranIdText + " has been submitted for your approval.";
        
        if(approverId) {

            var emailToId = approverId;
            var userName = 'User';
            if(approverName) {
                userName = approverName;
            }

            var approveURLParam = suiteletURL + '&processFlag=a&recId='+getEncodedValue(recordObj.id)+'&apr='+getEncodedValue(approverStatusId);
            var rejectURLParam = suiteletURL + '&processFlag=r&recId='+getEncodedValue(recordObj.id)+'&apr='+getEncodedValue(approverStatusId);

            bodyString += " <html>";
            bodyString += "     <body>";
            bodyString += "         Dear "+userName+",<br/><br/>You have received a new Purchase Requisition for approval.";
            bodyString += "         <br/><br/>";
            
            bodyString += "         <table>";
            bodyString += "         <tr><td>PR Number</td><td>:</td><td>"+tranIdText+"</td></tr>";
            bodyString += "         <tr><td>Requester</td><td>:</td><td>"+requestorName+"</td></tr>";
            bodyString += "         <tr><td>Total Amount</td><td>:</td><td>"+totalAmount+"</td></tr>";
            bodyString += "         <tr><td>Department</td><td>:</td><td>"+departnmentName+"</td></tr>";
            bodyString += "         <tr><td>Class</td><td>:</td><td>"+className+"</td></tr>";
            bodyString += "         </table>";
            bodyString += "         <br/><br/>";
            bodyString += requisitionTable;

            //bodyString += "         Attached PDF is snapshot of PR.<br/>";
            bodyString += "         Please use below buttons to either <i><b>Approve</b></i> or <i><b>Reject</b></i> PR.";
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
                body: bodyString
            });

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