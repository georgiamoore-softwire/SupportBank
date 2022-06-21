import { parse } from 'csv-parse';
import fs from 'fs';
import moment from 'moment';
import readlineSync from 'readline-sync';

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

function readTransactions (transactionFile) {
    fs.createReadStream(transactionFile)
        .pipe(parse({columns:true}))
        .on('data', (data) => {
            if (!checkAccountExists(data.From)){
                accounts.push(new Account(data.From, 0))
            }
            if (!checkAccountExists(data.To)){
                accounts.push(new Account(data.To, 0))
            }
            transactions.push(new Transaction(moment(data.Date,  "DD/MM/YYYY"), accounts.find(o => o.owner === data.From), accounts.find(o => o.owner === data.To), data.Narrative, parseFloat(data.Amount)))


        })
        .on('end', () => {
            consoleInterface();
        })

}

function checkAccountExists (person) {
    return accounts.find(o => o.owner === person)
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

readTransactions('Transactions2014.csv');