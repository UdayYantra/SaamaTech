/*********************************************************
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * File Name: SAM_ValidateBudgetOnPO_ue.js
 * Script Name: SAM_ValidateBudgetOnPOPR_UE	
 * Company: Saama Tech. 
 * Date	Created:	09-July-2019.
 * Date	Modified:	
 * Description:	
 **********************************************************/
define(['N/record', 'N/error', 'N/search', 'N/runtime'],

function(record, error, search, runtime) { 

	function afterSubmit(context) {
      	if (context.type === context.UserEventType.DELETE) {
        	return true;
        }
		var rec = context.newRecord;
		var recType = rec.type;
		
		var recId = rec.id;
		var recordObj = record.load({ type: recType, id: recId, isDynamic: true });
		var subsidiary = recordObj.getValue({ fieldId: 'subsidiary' });
		var department = recordObj.getValue({ fieldId: 'department' });
		var getclass = recordObj.getValue({ fieldId: 'class' });
		var location = recordObj.getValue({ fieldId: 'location' });
		var _total = recordObj.getValue({ fieldId: 'totalamount' });
		var _estimatedtotal = recordObj.getValue({ fieldId: 'estimatedtotal' });
		var lineItemCount = recordObj.getLineCount({ sublistId: 'item' });
		
			if(recType === 'purchaseorder') {
				fetchItemsDetails(lineItemCount, recordObj, subsidiary, department, getclass, _total, recType); 
			}
			else {
				fetchItemsDetails(lineItemCount, recordObj, subsidiary, department, getclass, _estimatedtotal, recType); 
			}
		
		recordObj.save({ enableSourcing: true, ignoreMandatoryFields: true });
	}
	
	function fetchItemsDetails(lineItemCount, recordObj, subsidiary, department, getclass, _total, recType) {
		
		var taxDetailsLineCount = recordObj.getLineCount({ sublistId: 'taxdetails' });
		var taxdetailsArray = new Array();
		var taxAmountArray = new Array();
		
		if(recType === 'purchaseorder') {
			
			for (var v = 0; v < taxDetailsLineCount; v++)  {

				var taxdetailsref = recordObj.getSublistValue({ sublistId: "taxdetails", fieldId: "taxdetailsreference", line: v });
				
				if(taxdetailsArray.indexOf(taxdetailsref) != -1) {
					var tax = recordObj.getSublistValue({ sublistId: "taxdetails", fieldId: "taxamount", line: v });
					var existingtax = taxAmountArray[taxdetailsArray.indexOf(taxdetailsref)];
					existingtax+=tax;
					taxAmountArray[taxdetailsArray.indexOf(taxdetailsref)] = existingtax;
				}
				else {
					var tax = recordObj.getSublistValue({ sublistId: "taxdetails", fieldId: "taxamount", line: v });
					taxAmountArray.push(tax);
					taxdetailsArray.push(taxdetailsref);
				}				
			}
		}
		
		if(subsidiary) {
			var subCalender = '';
			var subFieldLookUp = search.lookupFields({ type: search.Type.SUBSIDIARY, id: subsidiary, columns: ['fiscalcalendar']});
			log.debug({title: 'subFieldLookUp', details: subFieldLookUp});
			if(subFieldLookUp.fiscalcalendar.length > 0) {
				subCalender = subFieldLookUp.fiscalcalendar[0].value;
			}
		}

		var itemsArray = new Array();
		var accountArray = new Array();
		for (var i = 0; i < lineItemCount; i++)  {

			recordObj.selectLine({ sublistId: 'item', line: i });
			var itemId = recordObj.getSublistValue({ sublistId: "item", fieldId: "item", line: i });
			var itemTotal = 0;
			var taxamt = 0;
			
			if(recType === 'purchaseorder')  {
				
				itemTotal = recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: i });
				var taxdetailsreference = recordObj.getSublistValue({ sublistId: "item", fieldId: "taxdetailsreference", line: i });
				if(taxdetailsArray.indexOf(taxdetailsreference) != -1) {
					taxamt = taxAmountArray[taxdetailsArray.indexOf(taxdetailsreference)]; 
				}
			} 
			else {
				itemTotal = recordObj.getSublistValue({ sublistId: "item", fieldId: "estimatedamount", line: i });
			}
			
			var assetacc = recordObj.getSublistValue({ sublistId: "item", fieldId: "custcol_sam_assetacc", line: i });
			var expenseaccount = recordObj.getSublistValue({ sublistId: "item", fieldId: "custcol_sam_expenseaccount", line: i });
			
			department = recordObj.getSublistValue({ sublistId: "item", fieldId: "department", line: i });
			getclass = recordObj.getSublistValue({ sublistId: "item", fieldId: "class", line: i });
			
			var account = assetacc ? assetacc : expenseaccount;
			var utilizedCurrentBudget = 0;
			if(itemsArray.indexOf(itemId) != -1){
				for(var z = 0; z<itemsArray.length; z++) {
					if(itemsArray[z] == itemId) {
						var newItemTotal ='';
						if(recType === 'purchaseorder') {
							newItemTotal= recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: z });
							taxamt = taxAmountArray[z];
							newItemTotal+=taxamt;
						}
						else {
							newItemTotal= recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: z });
						}
						utilizedCurrentBudget += newItemTotal;
					}
				}
			}
			else if(accountArray.indexOf(account) != -1) {
				for(var z = 0; z<accountArray.length; z++) {
					if(accountArray[z] == account) {
						var newItemTotal ='';
						if(recType === 'purchaseorder') {
							newItemTotal = recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: z });
							taxamt = taxAmountArray[z];
							newItemTotal+=taxamt;
						}
						else {
							newItemTotal = recordObj.getSublistValue({ sublistId: "item", fieldId: "amount", line: z });
						}
						utilizedCurrentBudget += newItemTotal;
					}
				}
			}
			itemsArray.push(itemId);
			accountArray.push(account);
			if(recType === 'purchaseorder') {
				itemTotal+=taxamt;
			}
			setLineItemBudgetValues(itemId, subsidiary, department, getclass, _total, i, recordObj, itemTotal, utilizedCurrentBudget, assetacc, expenseaccount, subCalender);
		}
		
	}
	
	function setLineItemBudgetValues(itemId, subsidiary , department, getclass, _total, i, recordObj, itemTotal, utilizedCurrentBudget, assetacc, expenseaccount, subCalender){
		
		var recordId = recordObj.getValue({ fieldId: 'id' });
        
		var utilizedPRBudget = fetchAllPRDetails(itemId, subsidiary , department, getclass, recordId, i, assetacc, expenseaccount);
		var utilizedPOBudget = fetchAllPODetails(itemId, subsidiary , department, getclass, utilizedPRBudget, recordId, i, assetacc, expenseaccount);
		var utilizedVBBudget = fetchAllVBDetails(itemId, subsidiary , department, getclass, utilizedPOBudget, i, assetacc, expenseaccount);
		var utilizedBCBudget = fetchAllBCDetails(itemId, subsidiary , department, getclass, utilizedVBBudget, i, assetacc, expenseaccount);

		log.debug({title: 'utilizedPOBudget', details: utilizedPOBudget});
		log.debug({title: 'utilizedVBBudget', details: utilizedVBBudget});
		log.debug({title: 'utilizedBCBudget', details: utilizedBCBudget});
		log.debug({title: 'utilizedCurrentBudget', details: utilizedCurrentBudget});

		var totalUtilizedBudget = Number(utilizedBCBudget) + Number(utilizedCurrentBudget);
		
		log.debug({title: 'totalUtilizedBudget', details: totalUtilizedBudget});

		var intitalUtilizedBudget = fetchIntitalUtilizedBudget(itemId, subsidiary , department, getclass, assetacc);
		totalUtilizedBudget += Number(intitalUtilizedBudget);

		log.debug({title: 'intitalUtilizedBudget', details: intitalUtilizedBudget});

		var _actualBudgetAmount = fetchActualBudgetAmount(itemId, subsidiary , department, getclass, assetacc, subCalender);
		var _remainingBudgetAmount = Number(_actualBudgetAmount) - Number(totalUtilizedBudget);
		_remainingBudgetAmount = Number(_remainingBudgetAmount);
		
		log.debug({title: '_remainingBudgetAmount', details: _remainingBudgetAmount});

		var _afterRemainingBudget = Number(_remainingBudgetAmount) - Number(itemTotal);
		recordObj.selectLine({ sublistId: 'item', line: i });
		
		log.debug({title: '_afterRemainingBudget', details: _afterRemainingBudget});

		//Actual Budget
        recordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sam_actual_budget', line: i, value: _actualBudgetAmount });

        //Utilized Budget
        recordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sam_budgetutilised', line: i, value: totalUtilizedBudget });

        //Remaining Budget
        recordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sam_remaining_budget', line: i, value: _remainingBudgetAmount });

        // After Remaining Budget
        recordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sam_afterremainingpof', line: i, value: _afterRemainingBudget });
		
		// intital utilized Budget
        recordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_sam_used3mbudget', line: i, value: intitalUtilizedBudget });
		
		recordObj.commitLine({sublistId: 'item'});
	}
	
	function fetchIntitalUtilizedBudget(itemId, subsidiary , department, getclass, assetacc){
		var itemExpAcct = '';
		if(assetacc) {
			itemExpAcct = search.lookupFields({ type: 'item', id: itemId, columns: 'assetaccount' });
		}
		else {
			itemExpAcct = search.lookupFields({ type: 'item', id: itemId, columns: 'expenseaccount' });
		}
		
		var itemExpAccID = '';
      	if(assetacc) {
            itemExpAccID = itemExpAcct.assetaccount[0].value;
		} 
		else {
          	itemExpAccID = itemExpAcct.expenseaccount[0].value;
        }
		
		var filterBudget = new Array();
		filterBudget.push(search.createFilter({ name : 'custrecord_sam_account', operator : search.Operator.ANYOF, values : itemExpAccID }));
		filterBudget.push(search.createFilter({ name : 'custrecord_sam_subsidiaryub', operator : search.Operator.ANYOF, values : subsidiary }));

		if(department) {
			filterBudget.push(search.createFilter({ name : 'custrecord_sam_departmentub', operator : search.Operator.IS, values : department })); 
		}
		if(getclass) {
			filterBudget.push(search.createFilter({ name : 'custrecord_sam_classub', operator : search.Operator.IS, values : getclass })); 
		}

		var columnBudget = new Array();
		columnBudget.push(search.createColumn({ name : 'custrecord_sam_usedbudget3m' }));
		
		var budgetimportSearchObj = search.create({ "type" : 'customrecord_sam_budgetutilized', "filters" : filterBudget, "columns" : columnBudget });
		var searchResultCount = budgetimportSearchObj.runPaged().count;
		
		var budgetResult = budgetimportSearchObj.run().getRange({ start: 0, end: searchResultCount });

		//Declared variable to store the value of actual budget.
		var _actualBudgetAmount = Number(0);
		if (budgetResult.length > 0 && budgetResult != '' && budgetResult != null) {

		  _actualBudgetAmount = budgetResult[0].getValue({ name: 'custrecord_sam_usedbudget3m' });
		  
		}
		return _actualBudgetAmount;
		
	}
	
	function identifyYear(subCalender) {
		var yearRecId = '';
		var date = new Date();
		var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var period = months[date.getMonth()];
		period += " " +date.getFullYear();

		log.debug({title: 'period', details: period});

		var accountingperiodSearchObj = search.create({ type: "accountingperiod", filters: [["periodname","contains", period], "AND", ["fiscalcalendar", search.Operator.ANYOF, subCalender]], columns: [search.createColumn({name: "parent", label: "Parent"})]});
		var searchResultCount = accountingperiodSearchObj.runPaged().count;
		
		accountingperiodSearchObj.run().each(function(result) {
			
			var parentId = result.getValue({ name: 'parent' });
			
			var accountingperiodParent = record.load({ type: "accountingperiod", id: parentId, isDynamic: true, });
            var yearId = accountingperiodParent.getValue({ fieldId: 'parent' });
			yearRecId = yearId;
			
		   return true;
		});
		return yearRecId;
	}
	
	function fetchActualBudgetAmount(itemId, subsidiary , department, getclass, assetacc, subCalender) {
		var itemExpAcct = '';
		if(assetacc) {
			itemExpAcct = search.lookupFields({ type: 'item', id: itemId, columns: 'assetaccount' });
		}
		else {
			itemExpAcct = search.lookupFields({ type: 'item', id: itemId, columns: 'expenseaccount' });
		}
		
		var itemExpAccID = '';
      	if(assetacc) {
            itemExpAccID = itemExpAcct.assetaccount[0].value;
		}
		else {
          	itemExpAccID = itemExpAcct.expenseaccount[0].value;
        }
		
		var yearRecordId = identifyYear(subCalender);
		
		log.debug({title: 'itemExpAccID', details: itemExpAccID});
		log.debug({title: 'yearRecordId', details: yearRecordId});
		log.debug({title: 'subsidiary', details: subsidiary});
		log.debug({title: 'department', details: department});
		log.debug({title: 'getclass', details: getclass});

		var filterBudget = new Array();
		filterBudget.push(search.createFilter({ name : 'account', operator : search.Operator.ANYOF, values : itemExpAccID }));
		filterBudget.push(search.createFilter({ name : 'year', operator : search.Operator.IS, values : yearRecordId }));
		filterBudget.push(search.createFilter({ name : 'subsidiary', operator : search.Operator.ANYOF, values : subsidiary }));

		if(department) {
			filterBudget.push(search.createFilter({ name : 'department', operator : search.Operator.IS, values : department })); 
		}
		if(getclass) {
			filterBudget.push(search.createFilter({ name : 'class', operator : search.Operator.IS, values : getclass })); 
		}
		
		var columnBudget = new Array();
		columnBudget.push(search.createColumn({ name: "account", sort: search.Sort.ASC, label: "Account" }));
		columnBudget.push(search.createColumn({ name : 'department' }));
		columnBudget.push(search.createColumn({ name : 'subsidiary' }));
		columnBudget.push(search.createColumn({ name : 'location' }));
		columnBudget.push(search.createColumn({ name : 'amount' }));
		columnBudget.push(search.createColumn({ name : 'internalid' }));
		
		var budgetimportSearchObj = search.create({ "type" : 'budgetimport', "filters" : filterBudget, "columns" : columnBudget });

		var searchResultCount = budgetimportSearchObj.runPaged().count;
		log.debug("budgetimportSearchObj result count", searchResultCount);

		var budgetResult = budgetimportSearchObj.run().getRange({ start: 0, end: searchResultCount });

		//Declared variable to store the value of actual budget.
		var _actualBudgetAmount = Number(0);
		if (budgetResult.length > 0 && budgetResult != '' && budgetResult != null) {

		  _actualBudgetAmount = budgetResult[0].getValue({ name: 'amount' });
		  
		}
		log.debug({title: '_actualBudgetAmount', details: _actualBudgetAmount})
		return _actualBudgetAmount;
	}
	
	function fetchAllBCDetails(itemId, subsidiary , department, getclass, utilizedVBBudget, i, assetacc, expenseaccount) {

		var filterTransaction = new Array();
    	filterTransaction.push(search.createFilter({ name : 'subsidiary', operator : search.Operator.ANYOF, values : subsidiary }));
		filterTransaction.push(search.createFilter({ name : 'type', operator : search.Operator.ANYOF, values : "VendCred" }));
		filterTransaction.push(search.createFilter({ name : 'mainline', operator : search.Operator.IS, values : 'F' }));
		filterTransaction.push(search.createFilter({ name : 'approvalstatus', join: 'createdfrom', operator : search.Operator.NONEOF, values : '3' }));
		filterTransaction.push(search.createFilter({ name : 'createdfrom', join: 'createdfrom', operator : search.Operator.ANYOF, values : "@NONE@" }));
		filterTransaction.push(search.createFilter({ name : 'createdfrom', operator : search.Operator.NONEOF, values : "@NONE@" }));

		if(department) {
		    filterTransaction.push(search.createFilter({ name : 'department', operator : search.Operator.IS, values : department })); 
		}
		if(getclass) {
			filterTransaction.push(search.createFilter({ name : 'class', operator : search.Operator.IS, values : getclass }));
		}
		if(assetacc) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_assetacc', operator : search.Operator.ANYOF, values : assetacc }));
		}
		if(expenseaccount) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_expenseaccount', operator : search.Operator.ANYOF, values : expenseaccount }));
		}
		
		var columnTransaction = new Array();
		/*columnTransaction.push(search.createColumn({ name: "type", label: "Type" }));
		columnTransaction.push(search.createColumn({ name: "internalid", label: "Id" }));*/
		columnTransaction.push(search.createColumn({ name: "fxamount", label: "Total Amount", summary: search.Summary.SUM }));
		
		var transactionimportSearchObj = search.create({ type: "transaction", filters: filterTransaction, columns: columnTransaction });
		
		var searchResultCount = transactionimportSearchObj.runPaged().count;
		var resulttransactionimportSearchObj = transactionimportSearchObj.run();
		
		var ed = 0;
		
		for(var st=ed;st<searchResultCount;st++) {
			ed = st+999;
			if(searchResultCount < ed) {
				ed = Number(searchResultCount);
			}
			var transactionResult = resulttransactionimportSearchObj.getRange({start: Number(st), end: Number(ed)});

			//var _utilizedBudgetAmount = Number(0);
			var amountToBeAdded = Number(0);
			
			if(transactionResult) {
				var poArray = new Array();
				for(var a = 0; a < transactionResult.length; a++) {
					
					//var type = transactionResult[a].getValue({ name: 'type' });
					amountToBeAdded = Number(0);
					//TODO: logic to be rewritten for fetching the amount based on the line item amount of the PO
					
					var totalAmount = transactionResult[a].getValue({ name: 'fxamount', summary: search.Summary.SUM });
					amountToBeAdded = totalAmount;
					
					
					utilizedVBBudget = Number(utilizedVBBudget) + Number(amountToBeAdded);
				}
				
				st = Number(ed);
			}
			log.debug({title: 'BC utilizedVBBudget', details: utilizedVBBudget});
		}

		return utilizedVBBudget;

	}

	function fetchAllVBDetails(itemId, subsidiary , department, getclass, utilizedPOBudget, i, assetacc, expenseaccount) {
		
		var filterTransaction = new Array();
    	filterTransaction.push(search.createFilter({ name : 'subsidiary', operator : search.Operator.ANYOF, values : subsidiary }));
		filterTransaction.push(search.createFilter({ name : 'type', operator : search.Operator.ANYOF, values : "VendBill" }));
		filterTransaction.push(search.createFilter({ name : 'mainline', operator : search.Operator.IS, values : 'F' }));
		filterTransaction.push(search.createFilter({ name : 'approvalstatus', operator : search.Operator.NONEOF, values : '3' }));
		filterTransaction.push(search.createFilter({ name : 'createdfrom', operator : search.Operator.ANYOF, values : "@NONE@" }));

		if(department) {
		    filterTransaction.push(search.createFilter({ name : 'department', operator : search.Operator.IS, values : department })); 
		}
		if(getclass) {
			filterTransaction.push(search.createFilter({ name : 'class', operator : search.Operator.IS, values : getclass }));
		}
		if(assetacc) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_assetacc', operator : search.Operator.ANYOF, values : assetacc }));
		}
		if(expenseaccount) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_expenseaccount', operator : search.Operator.ANYOF, values : expenseaccount }));
		}
		
		var columnTransaction = new Array();
		/*columnTransaction.push(search.createColumn({ name: "type", label: "Type" }));
		columnTransaction.push(search.createColumn({ name: "internalid", label: "Id" }));*/
		columnTransaction.push(search.createColumn({ name: "fxamount", label: "Total Amount", summary: search.Summary.SUM }));
		
		var transactionimportSearchObj = search.create({ type: "transaction", filters: filterTransaction, columns: columnTransaction });
		
		var searchResultCount = transactionimportSearchObj.runPaged().count;
		var resulttransactionimportSearchObj = transactionimportSearchObj.run();
		
		var ed = 0;
		
		for(var st=ed;st<searchResultCount;st++) {
			ed = st+999;
			if(searchResultCount < ed) {
				ed = Number(searchResultCount);
			}
			var transactionResult = resulttransactionimportSearchObj.getRange({start: Number(st), end: Number(ed)});

			//var _utilizedBudgetAmount = Number(0);
			var amountToBeAdded = Number(0);

			if(transactionResult) {
				var poArray = new Array();
				for(var a = 0; a < transactionResult.length; a++) {
					
					//var type = transactionResult[a].getValue({ name: 'type' });
					amountToBeAdded = Number(0);
					//TODO: logic to be rewritten for fetching the amount based on the line item amount of the PO
					
					var totalAmount = transactionResult[a].getValue({ name: 'fxamount', summary: search.Summary.SUM });
					amountToBeAdded = totalAmount;
					
					
					utilizedPOBudget = Number(utilizedPOBudget) + Number(amountToBeAdded);
				}
				
				st = Number(ed);
			}
			log.debug({title: 'PO utilizedPOBudget', details: utilizedPOBudget});
		}

		return utilizedPOBudget;

	}

	function fetchAllPODetails(itemId, subsidiary , department, getclass, _utilizedBudgetAmount, recordId, z, assetacc, expenseaccount) {
		
		var filterTransaction = new Array();
    	filterTransaction.push(search.createFilter({ name : 'subsidiary', operator : search.Operator.ANYOF, values : subsidiary }));
		filterTransaction.push(search.createFilter({ name : 'type', operator : search.Operator.ANYOF, values : "PurchOrd" }));
		filterTransaction.push(search.createFilter({ name : 'mainline', operator : search.Operator.IS, values : 'F' }));
		filterTransaction.push(search.createFilter({ name : 'approvalstatus', operator : search.Operator.NONEOF, values : '3' }));

		if(department) {
		    filterTransaction.push(search.createFilter({ name : 'department', operator : search.Operator.IS, values : department })); 
		}
		if(getclass) {
			filterTransaction.push(search.createFilter({ name : 'class', operator : search.Operator.IS, values : getclass }));
		}
		if(assetacc) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_assetacc', operator : search.Operator.ANYOF, values : assetacc }));
		}
		if(expenseaccount) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_expenseaccount', operator : search.Operator.ANYOF, values : expenseaccount }));
		}
		if(recordId) {
			filterTransaction.push(search.createFilter({ name : 'internalid', operator : search.Operator.NONEOF, values : recordId }));
		}
		
		var columnTransaction = new Array();
		/*columnTransaction.push(search.createColumn({ name: "type", label: "Type" }));
		columnTransaction.push(search.createColumn({ name: "internalid", label: "Id" }));*/
		columnTransaction.push(search.createColumn({ name: "fxamount", label: "Total Amount", summary: search.Summary.SUM }));
		
		var transactionimportSearchObj = search.create({ type: "transaction", filters: filterTransaction, columns: columnTransaction });
		
		var searchResultCount = transactionimportSearchObj.runPaged().count;
		log.debug({title: ' PO searchResultCount', details: searchResultCount});
		var resulttransactionimportSearchObj = transactionimportSearchObj.run();
		
		var ed = 0;
		
		for(var st=ed;st<searchResultCount;st++) {
			ed = st+999;
			if(searchResultCount < ed) {
				ed = Number(searchResultCount);
			}

			var billSearchResultSet = '';
			var transactionResult = resulttransactionimportSearchObj.getRange({start: Number(st), end: Number(ed)});

			//var _utilizedBudgetAmount = Number(0);
			var amountToBeAdded = Number(0);

			if(transactionResult) {
				var poArray = new Array();
				for(var a = 0; a < transactionResult.length; a++) {
					
					//var type = transactionResult[a].getValue({ name: 'type' });
					amountToBeAdded = Number(0);
					//TODO: logic to be rewritten for fetching the amount based on the line item amount of the PO
					
					var totalAmount = transactionResult[a].getValue({ name: 'fxamount', summary: search.Summary.SUM });
					amountToBeAdded = totalAmount;
					
					
					_utilizedBudgetAmount = Number(_utilizedBudgetAmount) + Number(amountToBeAdded);
				}
				
				st = Number(ed);
			}
			log.debug({title: 'PR _utilizedBudgetAmount', details: _utilizedBudgetAmount});
		}
		return _utilizedBudgetAmount;

	}
	function fetchAllPRDetails(itemId, subsidiary , department, getclass, recordId, z, assetacc, expenseaccount) {
	
		var filterTransaction = new Array();
		filterTransaction.push(search.createFilter({ name : 'subsidiary', operator : search.Operator.ANYOF, values : subsidiary }));
		if(department) {
			filterTransaction.push(search.createFilter({ name : 'department', operator : search.Operator.IS, values : department })); 
		}
		if(getclass) {
			filterTransaction.push(search.createFilter({ name : 'class', operator : search.Operator.IS, values : getclass }));
        }
		if(assetacc) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_assetacc', operator : search.Operator.ANYOF, values : assetacc }));
		}
		if(expenseaccount) {
			filterTransaction.push(search.createFilter({ name : 'custcol_sam_expenseaccount', operator : search.Operator.ANYOF, values : expenseaccount }));
		}
		if(recordId) {
			filterTransaction.push(search.createFilter({ name : 'internalid', operator : search.Operator.NONEOF, values : recordId }));
		}
		filterTransaction.push(search.createFilter({ name : 'type', operator : search.Operator.ANYOF, values : "PurchReq" }));
		filterTransaction.push(search.createFilter({ name : 'mainline', operator : search.Operator.IS, values : 'F' }));
		filterTransaction.push(search.createFilter({ name : 'item', operator : search.Operator.ANYOF, values : itemId }));
		filterTransaction.push(search.createFilter({ name : 'approvalstatus', operator : search.Operator.NONEOF, values : '3' }));
		filterTransaction.push(search.createFilter({ name : 'purchaseorder', operator : search.Operator.ANYOF, values : '@NONE@' }));
		
		var columnTransaction = new Array();

		/*columnTransaction.push(search.createColumn({ name: "type", label: "Type" }));
		columnTransaction.push(search.createColumn({ name: "total", label: "Total Amount" }));
		columnTransaction.push(search.createColumn({ name: "internalid", label: "Id" }));*/
		columnTransaction.push(search.createColumn({ name: "fxamount", label: "Estimated Amount", summary: search.Summary.SUM}));
		var transactionimportSearchObj = search.create({ type: "transaction", filters: filterTransaction, columns: columnTransaction });

		var searchResultCount = transactionimportSearchObj.runPaged().count;
		
		log.debug({title: ' PR searchResultCount', details: searchResultCount});

		var resulttransactionimportSearchObj = transactionimportSearchObj.run();

		var ed = 0;

		for(var st=ed;st<searchResultCount;st++) {
			ed = st+999;
			if(searchResultCount < ed) {
				ed = Number(searchResultCount);
			}
			//log.debug({title: "St & Ed", details: st +" & "+ ed});
			var billSearchResultSet = '';
			var transactionResult = resulttransactionimportSearchObj.getRange({start: Number(st), end: Number(ed)});

			var _utilizedBudgetAmount = Number(0);
			var amountToBeAdded = Number(0);
			
			if(transactionResult) {

				for(var a = 0; a < transactionResult.length; a++) {
					
					/*var type = transactionResult[a].getValue({ name: 'type' });
					var prid = transactionResult[a].getValue({ name: 'internalid' });
					var isCurrentPO = false;
					
					if(recordId == prid) {
						isCurrentPO = true;
					}
					
					var linkCount = 0;
					if(prid) {
						var pr = record.load({ type: "purchaserequisition", id: prid, isDynamic: true });
						linkCount = pr.getLineCount({ sublistId: 'links' });
					}*/
					amountToBeAdded = Number(0);
					var estimatedTotalAmount = transactionResult[a].getValue({ name: 'fxamount', summary: search.Summary.SUM });
					
					var split = estimatedTotalAmount;
					
					if(estimatedTotalAmount.indexOf("-") >= 0) {
						split = estimatedTotalAmount.split("-");
						estimatedTotalAmount = split[1];
					}
					amountToBeAdded = Number(estimatedTotalAmount);
					/*if(linkCount == 0) {
						if(isCurrentPO) {
							if(z <= i) {
								log.debug('>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<', 'if');
							}
						}
						else {
							amountToBeAdded = Number(estimatedTotalAmount);
						}
					}
					else {
						log.debug("inside else ", "linkCount " + linkCount);
					}*/
					_utilizedBudgetAmount = Number(_utilizedBudgetAmount) + Number(amountToBeAdded);
					
				}
			}

			st = Number(ed);
		}
		log.debug({title: 'PR _utilizedBudgetAmount', details: _utilizedBudgetAmount});
		return _utilizedBudgetAmount;
	}
	return {
		afterSubmit: afterSubmit
	}
});