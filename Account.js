import moment from "moment";

export default class Account {
    constructor (owner, balance) {
        this.owner = owner;
        this.balance = balance;
        this.transactions = [];
    }

    adjustBalance (adjustment) {
        this.balance = parseFloat(this.balance + adjustment).toFixed(2);
    }

    addTransaction (transaction){
        this.transactions.push(transaction);
        transaction.accountFrom.owner === this.owner ? this.adjustBalance(-transaction.amount) : this.adjustBalance(transaction.amount);
    }

    toString(){
        console.log(this.owner+"'s transactions:\n")
        for (let i in this.transactions){
            let transaction = this.transactions[i]
            console.log("Date: " + moment(transaction.date).format("DD/MM/YYYY"))
            console.log("From: " + transaction.accountFrom.owner)
            console.log("To: " + transaction.accountTo.owner)
            console.log("Narrative: " + transaction.narrative)
            console.log("Amount: £" + transaction.amount)
            console.log("")
        }
    }
}
