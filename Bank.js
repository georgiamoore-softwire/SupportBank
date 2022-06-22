import moment from "moment";
import Transaction from "./Transaction.js";
import Account from "./Account.js";

export default class Bank {
    constructor(logger) {
        this.accounts = []
        this.transactions = []
        this.logger = logger;
    }

    addAccount(account) {
        this.accounts.push(account);
    }

    addTransaction(data, line, file) {
        if (this.validateTransactionData(data) === true) {
            let date = data.Date
            let accountFrom = this.getAccount(data.From)
            let accountTo = this.getAccount(data.To)
            this.transactions.push(new Transaction(date, accountFrom, accountTo, data.Narrative, parseFloat(data.Amount)));


        } else {
            this.reportTransactionImportError(data, line, file)
        }

    }

    listAll() {
        for (let i in this.accounts) {
            console.log("Owner: " + this.accounts[i].owner)
            console.log("Balance: " + this.accounts[i].balance)
            console.log("")
        }
    }

    listAccount(person) {
        if (this.accounts.find(o => o.owner === person)) {
            this.accounts.find(o => o.owner === person).toString()
        } else {
            console.log("Account not found.")
        }
    }

    getAccount (person) {
        return this.accounts.find(o => o.owner === person)
    }

    reportTransactionImportError (data, line, file) {
        console.log("An error occurred when importing transactions:")
        let exceptionList = this.validateTransactionData(data)[1]
        for (let j in exceptionList) {
            console.log(file + " - Line " + line + ": " + exceptionList[j]+'\n')
            this.logger.error("Error found in " + file + " - Line " + line + ": " + exceptionList[j])
        }
    }

    validateTransactionData(transaction) {
        let errors = []

        this.createAccountIfNotExisting(transaction.From)
        this.createAccountIfNotExisting(transaction.To)

        if (!moment(transaction.Date).isValid()){
            errors.push("Invalid date entered.")
        }

        if (isNaN(parseFloat(transaction.Amount))){
            errors.push("Invalid amount entered.")
        }
        return errors.length === 0 ?  true : [false, errors]
    }

    createAccountIfNotExisting (person) {
        if (!this.getAccount(person)){
            this.addAccount(new Account(person, 0))
            this.logger.debug("New account created - " + person)
        }
    }
}