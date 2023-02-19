const jwt=require('jsonwebtoken')
require('dotenv').config()


exports.authenticateAdmin=(req,res,next)=>{
    const token=req.cookies.jwt;
    if(!token)
        return res.status(401).json({ message: "Not authorized, token not available" })
    
    jwt.verify(token,process.env.JWT_KEY,(err,decodedvalues)=>{
        if (err)
             return res.status(401).json({ message: "token invalid" });
        if (decodedvalues.role!=="admin")
              return res.status(401).json({ message: "Not authorized" });
        next()

    })
}

exports.authenticateBasic=(req,res,next)=>{
    const token=req.cookies.jwt;
    if(!token)
        return res.status(401).json({ message: "Not authorized, token not available" })
    
    jwt.verify(token,process.env.JWT_KEY,(err,decodedvalues)=>{
        if (err)
             return res.status(401).json({ message: "token invalid" });
        if (decodedvalues.role!=="basic")
            return res.status(401).json({ message: "Not authorized" });
        next()

    })

}


