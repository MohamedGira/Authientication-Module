const connectDB=require('./models/db')
const express = require("express")
const utils=require("./utils/utilities")
const cookieParser =require("cookie-parser")
const authenticators=require("./middleware/Auth")
const app = express()
const cors= require('cors')
const AppError=require('./utils/AppError')
const {handleError}=require('./ErrorHandler')
const PORT = 5000




//saftey net

process.on('uncaughtException',err=>{
    console.trace(`Error: ${err}`)
    console.log('Uncaught Exception')
    process.exit(1)
    
})



connectDB()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
app.use(cors({origin:""}))
app.use(express.static(`${__dirname}\\front`))

app.get('/',(req,res)=>{
    res.redirect('/form.html')
})
app.use('/api/v1/auth',require('./Auth/route'))
app.use('/api/v1/admin',authenticators.authenticateAdmin,(req,res)=>res.json({message:"admin route"}))
app.use('/api/v1/basic',authenticators.authenticateBasic,(req,res)=>res.json({message:"basic route"}))


app.all('*',(req,res)=>{
    
    return next(new AppError(404,`cant find this route :${req.path},${req.method}`))
})

app.use(handleError)


const server= app.listen(PORT, () => console.log(`connected on port ${PORT}`))

//saftey net
process.on('unhandledRejection',err=>{
    console.log(`Error: ${err.name}. ${err.message}`)
    console.log('Uhnandled Rejection')
    server.close(()=>{
        process.exit(1)
    })
})