import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import fetchLookupData from '@salesforce/apex/CustomLookupLwcController.fetchLookupData';
import fetchDefaultRecord from '@salesforce/apex/CustomLookupLwcController.fetchDefaultRecord';
import saveSelectedRecord from '@salesforce/apex/CustomLookupLwcController.saveSelectedRecord';

const DELAY = 300; // delay for debouncing input

export default class CustomLookupLwc extends LightningElement {
    @api label = "Custom Account Lookup";
    @api placeholder = "search..."; 
    @api iconName = "standard:account";
    @api sObjectApiName = "Account";
    @api defaultRecordId = '';
    lstResult = []; 
    hasRecords = true; 
    searchKey = "";    
    isSearchLoading = false; 
    delayTimeout;
    selectedRecord = {}; 
    @api recordId = "";
    selectedaccountRecordId = "";

    connectedCallback() {
        if (this.defaultRecordId !== "") {
            // this.recordId = '001XXXXXXXXXXXX'; // Temporary static value for testing
            // console.log("Record ID at connectedCallback:: ", this.recordId);
            fetchDefaultRecord({ recordId: this.defaultRecordId, sObjectApiName: this.sObjectApiName })
                .then((result) => {
                    if (result) {
                        this.selectedRecord = result;
                        this.handelSelectRecordHelper();
                    }
                })
                .catch((error) => {
                    console.error("rror fetching default record:", error);
                    this.selectedRecord = {};
                });
        }
        console.log("Record ID :: ",this.recordId);
    }

    @wire(fetchLookupData, { searchKey: '$searchKey', sObjectApiName: '$sObjectApiName' })
    searchResult({ data, error }) {
        this.isSearchLoading = false;
        if (data) {
            this.hasRecords = data.length > 0;
            this.lstResult = data;
        } else if (error) {
            console.error("Error:", error);
        }
    }

    handleKeyChange(event) {
        this.isSearchLoading = true;
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        this.delayTimeout = setTimeout(() => {
            this.searchKey = searchKey;
        }, DELAY);
    }

    toggleResult(event) {
        const lookupInputContainer = this.template.querySelector('.lookupInputContainer');
        const clsList = lookupInputContainer.classList;
        const whichEvent = event.target.getAttribute('data-source');
        if (whichEvent === 'searchInputField') {
            clsList.add('slds-is-open');
        } else if (whichEvent === 'lookupContainer') {
            clsList.remove('slds-is-open');
        }
    }

    handleRemove() {
        this.searchKey = '';    
        this.selectedRecord = {};
        this.lookupUpdatehandler(undefined);
        const searchBoxWrapper = this.template.querySelector('.searchBoxWrapper');
        searchBoxWrapper.classList.remove('slds-hide');
        searchBoxWrapper.classList.add('slds-show');
        const pillDiv = this.template.querySelector('.pillDiv');
        pillDiv.classList.remove('slds-show');
        pillDiv.classList.add('slds-hide');
    }

    handelSelectedRecord(event) {   
        const objId = event.target.getAttribute('data-recid');
        console.log(objId);
        this.selectedRecord = this.lstResult.find(data => data.Id === objId);
        console.log(this.selectedRecord);
        this.lookupUpdatehandler(this.selectedRecord);
        // Called to save to Object Manager 
        // this.saveSelectedRecordToServer(this.selectedRecord.Id);
        this.selectedaccountRecordId = this.selectedRecord.Id;
        this.handelSelectRecordHelper();
    }

    handelSelectRecordHelper() {
        this.template.querySelector('.lookupInputContainer').classList.remove('slds-is-open');
        const searchBoxWrapper = this.template.querySelector('.searchBoxWrapper');
        searchBoxWrapper.classList.remove('slds-show');
        searchBoxWrapper.classList.add('slds-hide');

        const pillDiv = this.template.querySelector('.pillDiv');
        pillDiv.classList.remove('slds-hide');
        pillDiv.classList.add('slds-show');

        if (submitButton) {
            submitButton.classList.remove('slds-hide');
            submitButton.classList.add('slds-show');
        } else {
            console.error('Submit button not found in the template');
        }
    }

    // Save to Object Manager
    saveSelectedRecordToServer(event) {
        saveSelectedRecord({ recordId: this.recordId, accountId: this.selectedaccountRecordId })
        .then(() => {
            console.log('Account Linked successfully');
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Account linked successfully',
                    variant: 'success',
                }),
            );
        })
        .catch((error) => {
            console.error('Error saving record:', error);
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'Error saving record',
                    variant: 'error',
                }),
            );
        });
    }


    lookupUpdatehandler(value) {    
        const oEvent = new CustomEvent('lookupupdate', {
            detail: { selectedRecord: value }
        });
        this.dispatchEvent(oEvent);
    }
}