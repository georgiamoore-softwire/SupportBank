// noinspection JSUnresolvedVariable

import fs from "fs";
import {parse} from "csv-parse/browser/esm";
import moment from "moment";
import Account from "./Account.js";
import Transaction from "./Transaction.js";
import path from "path";
import JSONStream from "JSONStream";

let _self;
export default class Importer {

    constructor(logger, bank) {
        this.logger = logger
        this.bank = bank
        _self = this;
    }

    createAccountIfNotExisting (person) {
        if (!this.bank.getAccount(person)){
            this.bank.addAccount(new Account(person, 0))
            this.logger.debug("New account created - " + person)
        }
    }

    createTransaction(data) {
        let date = moment(data.Date, "DD/MM/YYYY")
        let accountFrom = this.bank.getAccount(this.determineAccountNameSyntax(data, "From"))
        let accountTo = this.bank.getAccount(this.determineAccountNameSyntax(data, "To"))
        this.bank.addTransaction(new Transaction(date, accountFrom, accountTo, data.Narrative, parseFloat(data.Amount)))

    }

    reportTransactionImportError (data, line, file) {
        console.log("An error occurred when importing transactions:")
        let exceptionList = _self.validateTransactionData(data)[1]
        for (let j in exceptionList) {
            console.log(file + " - Line " + line + ": " + exceptionList[j]+'\n')
            this.logger.error("Error found in " + file + " - Line " + line + ": " + exceptionList[j])
        }
    }

    async importTransactions(file) {
        try {
            await this.parseTransactions(file)
            this.logger.debug("Finished import from " + file)
        }
        catch(e){
            console.log("There was an error importing from "+ file+": "+ e)
            this.logger.error("Error importing from " + file +": "+ e)
        }
    }
    parseCSVData(stream){
        return stream.pipe(parse({columns: true}))
    }
    parseJSONData(stream){
        return stream.pipe(JSONStream.parse('*'))
    }

    determineFileParser(file, stream){
        let extension = path.extname(file).slice(1)
        if (extension === 'json') {
            return this.parseJSONData(stream)
        } else if (extension === 'csv') {
            return this.parseCSVData(stream)
        } else {
            console.log("Invalid file type.")
            this.logger.error("User inputted file was invalid type - " + files[i])
        }
    }
    async parseTransactions (file) {
        _self.logger.debug("Importing transactions from " + file)
        return new Promise(function (resolve, reject) {
            let line = 1;
            let stream = fs.createReadStream(file)
                stream = _self.determineFileParser(file, stream)

                stream.on('data', (data) => {
                    line++;
                    if (_self.validateTransactionData(data) === true) {
                        _self.createTransaction(data)
                    } else {
                        _self.reportTransactionImportError(data, line, file)
                    }
                })
                .on('error', (e) => {
                    console.log("An error occurred when importing transactions: " + e)
                    _self.logger.error("Error in parsing transactions - " + e)
                    reject()
                })
                .on('end', () => {
                    resolve()
                })
        })
    }

    determineAccountNameSyntax(transaction, transactionDirection){
        if (transactionDirection === "From"){
            return transaction.From ? transaction.From : transaction.FromAccount
        } else if (transactionDirection === "To"){
            return transaction.To ? transaction.To : transaction.ToAccount
        }
    }

    validateTransactionData(transaction) {
        let errors = []

        this.createAccountIfNotExisting(this.determineAccountNameSyntax(transaction, "From"))
        this.createAccountIfNotExisting(this.determineAccountNameSyntax(transaction, "To"))

        if (!moment(transaction.Date).isValid()){
            errors.push("Invalid date entered.")
        }

        if (isNaN(parseFloat(transaction.Amount))){
            errors.push("Invalid amount entered.")
        }
        return errors.length === 0 ?  true : [false, errors]
    }

    async importFiles(files) {
        for (let i in files) {
            if (fs.existsSync(files[i])) {
                await this.importTransactions(files[i])
            } else {
                console.log("File not found.")
                this.logger.error("User inputted file not found - " + files[i])
            }
        }
    }
}



