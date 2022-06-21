import { parse } from 'csv-parse';
import fs from 'fs';
import moment from 'moment';
import readlineSync from 'readline-sync';
import log4js from 'log4js';


log4js.configure({
    appenders: {
        program: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['program'], level: 'debug'}
    }
});

const logger = log4js.getLogger()
logger.level = "debug";


let transactions = [];
let accounts = [];


class Account {
    constructor (owner, balance) {
        this.owner = owner;
        this.balance = balance;
        this.transactions = [];
    }

    adjustBalance (adjustment) {
        this.balance = this.balance + parseFloat(adjustment);
        this.balance= parseFloat(this.balance).toFixed(2)
    }

    addTransaction (transaction, amount){
        this.transactions.push(transaction);
        this.adjustBalance(amount);
    }
}

class Transaction {
    constructor (date, accountFrom, accountTo, narrative, amount) {
        this.date = date;
        this.accountFrom = accountFrom;
        this.accountTo = accountTo;
        this.narrative = narrative;
        this.amount = amount;
        accountFrom.addTransaction(this, this.amount * -1)
        accountTo.addTransaction(this, this.amount)
    }

}

function listAll () {
    for (let i in accounts){
        console.log("Owner: " + accounts[i].owner)
        console.log("Balance: " + accounts[i].balance)
        console.log("")
    }
}

function listAccount (person) {
    if (accounts.find(o => o.owner === person)){
        let foundAccount = accounts.find(o => o.owner === person)
        console.log(foundAccount.owner)
        for (let i in foundAccount.transactions){
            let transaction = foundAccount.transactions[i]
            console.log("Date: " + moment(transaction.date).format("DD/MM/YYYY"))
            console.log("From: " + transaction.accountFrom.owner)
            console.log("To: " + transaction.accountTo.owner)
            console.log("Narrative: " + transaction.narrative)
            console.log("Amount: £" + transaction.amount)
            console.log("")
        }
    } else {
        console.log("Account not found.")
    }
}

async function readTransactions(files) {
    for (let i in files) {
        await parseTransactions(files[i])
        logger.debug("Finished import from " + files[i])
    }
}

async function parseTransactions (file){
    logger.debug("Importing transactions from " + file)
    return new Promise(function (resolve, reject) {
        let line = 1;
        fs.createReadStream(file)
            .pipe(parse({columns: true}))
            .on('data', (data) => {
                line++;
                if (validateTransactionData(data) === true) {
                    transactions.push(new Transaction(moment(data.Date, "DD/MM/YYYY"), accounts.find(o => o.owner === data.From), accounts.find(o => o.owner === data.To), data.Narrative, parseFloat(data.Amount)))
                } else {
                    console.log("An error occured when importing transactions:")
                    let exceptionList = validateTransactionData(data)[1]
                    for (let j in exceptionList) {
                        console.log(file + " - Line " + line + ": " + exceptionList[j]+'\n')
                        logger.error("Error found in " + file + " - Line " + line + ": " + exceptionList[j])
                    }

                }
            })
            .on('error', (e) => {
                console.log("An error occurred when importing transactions: " + e)
                logger.error("Error in parsing transactions - " + e)
                reject()
            })
            .on('end', () => {
                resolve()
            })

    })
}

function validateTransactionData (transaction) {
    let errors = []
    checkAccountExists(transaction.From)
    checkAccountExists(transaction.To)

    if (!moment(transaction.Date, "DD/MM/YYYY").isValid()){
        errors.push("Invalid date entered.")
    }

    if (isNaN(parseFloat(transaction.Amount))){
        errors.push("Invalid amount entered.")
    }
    return errors.length == 0 ?  true : [false, errors]
}

function checkAccountExists (person) {
    if (!accounts.find(o => o.owner === person)){
        accounts.push(new Account(person, 0))
        logger.debug("New account created - " + person)
    }
}

function consoleInterface () {
    let response = readlineSync.question('Please enter 1 to list all accounts, 2 to look at a specific account, or q to quit. ').toString();
    if (response === '1'){
        listAll()
        consoleInterface()
    } else if (response === '2'){
        let person = readlineSync.question('Please enter the name of the account. ').toString();
        listAccount(person);
        consoleInterface()
    } else if (response.toLowerCase() === 'q') {
        process.exit();
    } else {
        console.log("Please enter a valid response.");
        consoleInterface();
    }
}
logger.debug("Program started.");
readTransactions(['Transactions2014.csv','DodgyTransactions2015.csv']).then(r => consoleInterface());
