// noinspection JSUnresolvedVariable

import fs from "fs";
import {parse} from "csv-parse/browser/esm";
import moment from "moment";
import path from "path";
import JSONStream from "JSONStream";
import xml2js from "xml2js";

let _self;
export default class Importer {

    constructor(logger, bank) {
        this.logger = logger
        this.bank = bank
        _self = this;
    }

    standardiseTransactionDataFormat (date, from, to, amount, narrative){
        return {
            Date: date,
            From: from,
            To: to,
            Amount: amount,
            Narrative: narrative
        }
    }

    async importTransactions(file) {
        try {
            await this.parseTransactions(file)
            this.logger.debug("Finished import from " + file)
        }
        catch(e){
            console.log("There was an error importing from "+ file+": "+ e)
            this.logger.error("Error importing from " + file +": "+ e)
        }
    }

    async parseTransactions (file) {
        _self.logger.debug("Importing transactions from " + file)
        return new Promise(function (resolve, reject) {

            let stream = fs.createReadStream(file)
            stream = _self.determineFileParser(file, stream)

            stream.on('error', (e) => {
                console.log("An error occurred when importing transactions: " + e)
                _self.logger.error("Error in parsing transactions - " + e)
                reject()
            })
                .on('end', () => {
                    resolve()
                })
        })
    }

    determineFileParser(file, stream){
        let extension = path.extname(file).slice(1)
        if (extension === 'json') {
            return this.parseJSONData(stream, file)
        } else if (extension === 'csv') {
            return this.parseCSVData(stream, file)
        } else if (extension === 'xml') {
            return this.parseXMLData(stream, file)
        }
        else {
            console.log("Invalid file type.")
            this.logger.error("User inputted file was invalid type - " + files[i])
        }
    }

    parseCSVData(stream, file){
        return this.createTransactionsFromFile(stream.pipe(parse({columns: true})), file)
    }

    parseJSONData(stream, file){
        return this.createTransactionsFromFile(stream.pipe(JSONStream.parse('*')), file)
    }

    parseXMLData(stream, file){
        let line = 1;
        return stream.on('data', (data) => {
            let parser = new xml2js.Parser();
            parser.parseString(data, function (err, result) {
                let transactions = result.TransactionList.SupportTransaction
                for (let i in transactions){

                    let date = moment((transactions[i].$.Date- (25567 +2))*86400*1000) // formula for date conversion https://gist.github.com/christopherscott/2782634
                    let from =  transactions[i].Parties[0].From[0]
                    let to = transactions[i].Parties[0].To[0]
                    let amount =  transactions[i].Value[0]
                    let narrative =  transactions[i].Description[0]

                    let newTransactionData = _self.standardiseTransactionDataFormat(date, from, to, amount, narrative)

                    line++;
                    _self.bank.addTransaction(newTransactionData, line, file)
                }
            });
        })
    }

    createTransactionsFromFile (stream, file) {
        let line = 1;
        return stream.on('data', (data) => {
            let date = moment(data.Date,  ["DD/MM/YYYY","YYYY/MM/DD"])
            let from = this.determineAccountNameSyntax(data, "From")
            let to = this.determineAccountNameSyntax(data, "To")
            let amount =  data.Amount
            let narrative =  data.Narrative
            let newTransactionData = this.standardiseTransactionDataFormat(date, from, to, amount, narrative)

            line++;
            this.bank.addTransaction(newTransactionData, line, file)

        })
    }

    determineAccountNameSyntax(transaction, transactionDirection){
        if (transactionDirection === "From"){
            return transaction.From ? transaction.From : transaction.FromAccount
        } else if (transactionDirection === "To"){
            return transaction.To ? transaction.To : transaction.ToAccount
        }
    }

    async importFiles(files) {
        for (let i in files) {
            if (fs.existsSync(files[i])) {
                await this.importTransactions(files[i])
            } else {
                console.log("File not found.")
                this.logger.error("User inputted file not found - " + files[i])
            }
        }
    }
}



