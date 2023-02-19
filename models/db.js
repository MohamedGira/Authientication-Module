const mongoose= require("mongoose")

const localDB = "mongodb://127.0.0.1:27017/newdb"
mongoose.set('strictQuery', false);

const connectDb= async()=>{
    console.log("connecting to db")
    await mongoose.connect(localDB,{
        useNewUrlParser:true,
        useUnifiedTopology:true   
    })

    console.log("Db connected")
}



module.exports=connectDb
