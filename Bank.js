export default class Bank {
    constructor() {
        this.accounts = []
        this.transactions = []
    }

    addAccount(account) {
        this.accounts.push(account);
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
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
}