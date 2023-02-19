const connectDB=require('./models/db')
const express = require("express")
const sizeInBytes=require("./utils/utilities")
const cookieParser =require("cookie-parser")
const authenticators=require("./middleware/Auth")
const app = express()

const PORT = 5000
connectDB()


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
    

app.use('/api/auth',require('./Auth/route'))
app.use('/admin',authenticators.authenticateAdmin,(req,res)=>res.json({message:"admin route"}))
app.use('/basic',authenticators.authenticateBasic,(req,res)=>res.json({message:"basic route"}))



app.all('*',(req,res)=>{
    res.status(404).json({
        message: "cant find this api",
        path:req.path 
    })
})
app.listen(PORT, () => console.log(`connected on port ${PORT}`))
 