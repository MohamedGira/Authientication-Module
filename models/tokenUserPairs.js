const mongoose= require("mongoose")
const user=require("./user")
const tokenUserPairSchema= new mongoose.Schema({
    token:{
        type:String,
        unique:true,
        required:true
    }, 
    userId:{
        type:String,
        unique:true,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true,
    }
})

const Token= mongoose.model('tokenUserPairs',tokenUserPairSchema)

module.exports=Token