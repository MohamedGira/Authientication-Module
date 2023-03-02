const User=require('./user')
const Token = require("./tokenUserPairs");

class MongooseDbManager{
    constructor(){
        this.User=User;
        this.Token=Token;
    }
}
module.exports =  new MongooseDbManager()

 
