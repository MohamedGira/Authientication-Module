const connectDB=require('./models/db')
const express = require("express")
const utils=require("./utils/utilities")
const cookieParser =require("cookie-parser")
const authenticators=require("./middleware/Auth")
const app = express()
const cors= require('cors')
const PORT = 5000
connectDB()


app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(cors({origin:""}))
app.use(express.static(`${__dirname}\\front`))

app.use('/api/v1/auth',require('./Auth/route'))
app.use('/api/v1/admin',authenticators.authenticateAdmin,(req,res)=>res.json({message:"admin route"}))
app.use('/api/v1/basic',authenticators.authenticateBasic,(req,res)=>res.json({message:"basic route"}))


app.all('*',(req,res)=>{
    return res.status(404).json({
        status:404,
        message: `cant find this route :${req.path},${req.method}` 
    })
    
})

app.use((err,req,res,next)=>{
    
    err.statusCode=err.statusCode||500;
    err.status=err.status||'Server Error';
    return res.status(err.statusCode).json({
        status:err.status,
        message: err.message||'sorry somthing went wrong :(' 
    })
})


app.listen(PORT, () => console.log(`connected on port ${PORT}`))