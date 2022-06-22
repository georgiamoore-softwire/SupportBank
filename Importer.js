import fs from "fs";
import {parse} from "csv-parse/browser/esm";
import moment from "moment";
import Account from "./Account.js";
import Transaction from "./Transaction.js";
import path from "path";

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
        let accountFrom = this.bank.getAccount(data.From)
        let accountTo = this.bank.getAccount(data.To)
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

    async readTransactions(files) {
        for (let i in files) {
            await this.parseTransactions(files[i])
            this.logger.debug("Finished import from " + files[i])
        }
    }

    async parseTransactions (file) {

        _self.logger.debug("Importing transactions from " + file)
        return new Promise(function (resolve, reject) {
            let line = 1;
            fs.createReadStream(file)
                .pipe(parse({columns: true}))
                .on('data', (data) => {
                    line++;
                    if (_self.validateTransactionData(data) === true) {
                        _self.createTransaction(data)
                    } else {
                        _self.reportTransactionImportError(data, line, file)
                    }
                })
                .on('error', (e) => {
                    console.log("An error occurred when importing transactions: " + e)
                    this.logger.error("Error in parsing transactions - " + e)
                    reject()
                })
                .on('end', () => {
                    resolve()
                })

        })
    }

    validateTransactionData(transaction) {
        let errors = []
        this.createAccountIfNotExisting(transaction.From)
        this.createAccountIfNotExisting(transaction.To)

        if (!moment(transaction.Date, "DD/MM/YYYY").isValid()){
            errors.push("Invalid date entered.")
        }

        if (isNaN(parseFloat(transaction.Amount))){
            errors.push("Invalid amount entered.")
        }
        return errors.length === 0 ?  true : [false, errors]
    }

    async importFile(file) {
        let extension = path.extname(file).slice(1)
        if (fs.existsSync(file)) {
            if (extension === 'json') {
                console.log("WIP")
            } else if (extension === 'csv') {
                await this.parseTransactions(file)
            } else {
                console.log("Invalid file type.")
                this.logger.error("User inputted file was invalid type - " + file)
            }
        } else {
            console.log("File not found.")
            this.logger.error("User inputted file not found - " + file)
        }
    }
}



