/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * File Name: SAM_UpdateBudgetStatus_ue.js
 * Script Name: SAM_updateBudgetStatus_UE
 * Company: Saama Tech. 
 * Date	Created:	10-July-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/

 define(['N/record'], function(record) {


    function afterSubmit(context) {

        if (context.type === context.UserEventType.DELETE) {
        	return true;
        }

        var rec = context.newRecord;
		var recType = rec.type;
      	var recId = rec.id;
        
        var recordObj = record.load({
              type: recType,
              id: recId,
              isDynamic: true,
        });
        
        var itemLineCount = recordObj.getLineCount({sublistId: 'item'});

        if(Number(itemLineCount) > 0) {
            
            var outOfBudget = false;
            var withinBudget = 0;
            var budgetNotDefined = 0;

            for(var i=0;i<itemLineCount;i++) {

                var actualBudget            = recordObj.getSublistValue({sublistId: 'item', fieldId: 'custcol_sam_actual_budget', line: i});
                var utilizedBudget          = recordObj.getSublistValue({sublistId: 'item', fieldId: 'custcol_sam_budgetutilised', line: i});
                var remainingBudget         = recordObj.getSublistValue({sublistId: 'item', fieldId: 'custcol_sam_remaining_budget', line: i});
                var afterRemainingBudget    = recordObj.getSublistValue({sublistId: 'item', fieldId: 'custcol_sam_afterremainingpof', line: i});

                if(Number(actualBudget) > 0 && Number(afterRemainingBudget) < 0) {
                    //Out of Budget
                    outOfBudget = true;
                    break;
                }
                else if(Number(actualBudget) > 0 && Number(afterRemainingBudget) >= 0) {
                    //Within Budget
                    withinBudget++;
                }
                else if(!actualBudget || Number(actualBudget) == 0) {
                    //Budget Not Defined
                    budgetNotDefined++;
                }

            }//for(var i=0;i<itemLineCount;i++) 

            if(outOfBudget) {
                recordObj.setValue({fieldId: 'custbody_sam_act_budgetary_status', value: 2});
                //if(!recordObj.getValue({fieldId: 'custbody_sam_budgetary_status'})) { 
                    recordObj.setValue({fieldId: 'custbody_sam_budgetary_status', value: 2}); 
                //}
            }
            else if(Number(budgetNotDefined) == Number(itemLineCount)) {
                recordObj.setValue({fieldId: 'custbody_sam_act_budgetary_status', value: 3});
                //if(!recordObj.getValue({fieldId: 'custbody_sam_budgetary_status'})) { 
                    recordObj.setValue({fieldId: 'custbody_sam_budgetary_status', value: 3}); 
                //}
            }
            else if(Number(withinBudget) > 0) {
                recordObj.setValue({fieldId: 'custbody_sam_act_budgetary_status', value: 1});
                //if(!recordObj.getValue({fieldId: 'custbody_sam_budgetary_status'})) { 
                    recordObj.setValue({fieldId: 'custbody_sam_budgetary_status', value: 1}); 
                //}
            }

        }//if(Number(itemLineCount) > 0)

        recordObj.save({
			enableSourcing: true,
			ignoreMandatoryFields: true
		});

    }

    return {
        afterSubmit: afterSubmit
    }

 });