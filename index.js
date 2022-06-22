import readlineSync from 'readline-sync';
import log4js from 'log4js';
import Bank from './Bank.js';
import Importer from './Importer.js'

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
let importer = new Importer(logger, bank);


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
        importer.importFiles([file]).then(() => logger.debug("File import finished."))
        console.log("File imported successfully.\n")
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
importer.importFiles(['Transactions2012.xml', 'Transactions2013.json']).then(() => consoleInterface());
