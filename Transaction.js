export default class Transaction {
    constructor (date, accountFrom, accountTo, narrative, amount) {
        this.date = date;
        this.accountFrom = accountFrom;
        this.accountTo = accountTo;
        this.narrative = narrative;
        this.amount = amount;
        accountFrom.addTransaction(this)
        accountTo.addTransaction(this)
    }
}