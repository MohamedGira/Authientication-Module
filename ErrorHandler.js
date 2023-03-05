
const sendErrorDev=(err,res)=>{
    return res.status(err.statusCode).json({
        status:err.status,
        message: err.message,
        stack:err.stack
    })
}


const sendErrorProd=(err,res)=>{
    if(!err.isOperational)
        console.error('Error: ',err)
    
      
    return res.status(err.statusCode).json({
        status:err.status,
        message: err.message ,
    })
}
exports.handleError=(err,req,res,next)=>{
    
    err.statusCode=err.statusCode||500;
    err.status=err.status||'Server Error';
    err.message=err.message||'sorry somthing went wrong :(' 

    if(process.env.NODE_ENV==='development')
    {
        sendErrorDev(err,res)
    }else{
        sendErrorProd(err,res)
    }
}