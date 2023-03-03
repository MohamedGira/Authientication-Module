const jwt=require('jsonwebtoken')
require('dotenv').config()
const MError=require('../utils/AppError')

exports.authenticateAdmin=(req,res,next)=>{
    const token=req.cookies.jwt;
    if(!token)
        return next(new MError(401,'token not available'))
    
    
    jwt.verify(token,process.env.JWT_KEY,(err,decodedvalues)=>{
        if (err)
             return next(new MError(401,'token invalid'))
        if (decodedvalues.role!=="admin")
            return next(new MError(401,'Not authorized'))
        next()

    })
}

exports.authenticateBasic=(req,res,next)=>{
    const token=req.cookies.jwt;
    if(!token)
     return next(new MError(401,'token not available'))

    
    jwt.verify(token,process.env.JWT_KEY,(err,decodedvalues)=>{
        if (err)
            return next(new MError(401,'token invalid'))
        if (decodedvalues.role!=="basic")
            return next(new MError(401,'Not authorized'))
        next()

    })

}


