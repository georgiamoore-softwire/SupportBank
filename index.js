import { parse } from 'csv-parse';
import fs from 'fs';
import moment from 'moment';
import readlineSync from 'readline-sync';
import log4js from 'log4js';
import * as path from "path";
import Account from './Account.js';
import Transaction from './Transaction.js';
import Bank from './Bank.js';

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


let bank = new Bank();

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
                    createTransaction(data)
                } else {
                    reportTransactionImportError(data, line, file)
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
    return errors.length === 0 ?  true : [false, errors]
}

function checkAccountExists (person) {
    if (!bank.getAccount(person)){
        bank.addAccount(new Account(person, 0))
        logger.debug("New account created - " + person)
    }
}

function createTransaction (data) {
    let date = moment(data.Date, "DD/MM/YYYY")
    let accountFrom = bank.getAccount(data.From)
    let accountTo = bank.getAccount(data.To)
    bank.addTransaction(new Transaction(date, accountFrom, accountTo, data.Narrative, parseFloat(data.Amount)))
}

function reportTransactionImportError (data, line, file) {
    console.log("An error occurred when importing transactions:")
    let exceptionList = validateTransactionData(data)[1]
    for (let j in exceptionList) {
        console.log(file + " - Line " + line + ": " + exceptionList[j]+'\n')
        logger.error("Error found in " + file + " - Line " + line + ": " + exceptionList[j])
    }

}

async function importFile(file) {
    let extension = path.extname(file).slice(1)
    if (fs.existsSync(file)) {
        if (extension === 'json') {
            console.log("WIP")
        } else if (extension === 'csv') {
            await parseTransactions(file)
        } else {
            console.log("Invalid file type.")
            logger.error("User inputted file was invalid type - " + file)
        }
    } else {
        console.log("File not found.")
        logger.error("User inputted file not found - " + file)
    }
}

function consoleInterface () {
    let response = readlineSync.question('1 - List all accounts \n' +
                                                '2 - View a specific account \n' +
                                                '3 - Import transactions from file \n' +
                                                'q - Quit. \n').toString();
    if (response === '1'){
        bank.listAll()
        consoleInterface()
    } else if (response === '2'){
        let person = readlineSync.question('Please enter the name of the account. ').toString();
        bank.listAccount(person);
        consoleInterface()
    } else if (response === '3') {
        let file = readlineSync.question('Please enter the name of the file. ').toString();
        importFile(file).then(() =>  console.log("File imported successfully.\n"));
        logger.debug("Transaction file "+file+" imported successfully.")
        consoleInterface()
    } else if (response.toLowerCase() === 'q') {
        process.exit();
    } else {
        console.log("Please enter a valid response.");
        consoleInterface();
    }
}

logger.debug("Program started.");
readTransactions(['Transactions2014.csv','DodgyTransactions2015.csv']).then(() => consoleInterface());
