import { parse } from 'csv-parse';
import fs from 'fs';

let transactions = [];
// let people = [];
let accounts = [];


readTransactions('Transactions2014.csv');

// class Person {
//     constructor (personName, account) {
//         this.personName = personName;
//         this.account = account;
//     }
// }

class Account {
    constructor (owner, balance) {
        this.owner = owner;
        this.balance = balance;
        this.transactions = [];
    }

    getBalance () {
        return this.balance;
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

}

function listAccount (account) {

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
            transactions.push(new Transaction(data.Date, accounts.find(o => o.owner === data.From), accounts.find(o => o.owner === data.To), data.Narrative, data.Amount))


        })
        .on('end', () => {
            console.log(transactions)
            console.log(accounts)
        })

}

function checkAccountExists(person){
    return accounts.find(o => o.owner === person)
}