const mongoose= require("mongoose")

const userSchema= new mongoose.Schema({
    username:{
        type:String,
        unique:true,
        required:true
    }, 
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        minlength: 6,
        required:true
    }
    ,
    role:{
        type:String,
        default:"basic",
        required:true,
    },
    confirmed:{
        type:Boolean,
        default:false,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true,
    }
})

const User= mongoose.model('user',userSchema)

module.exports=User