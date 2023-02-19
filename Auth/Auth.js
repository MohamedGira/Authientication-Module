const User= require('../models/user');
const Token= require('../models/tokenUserPairs');
const utils=require('../utils/utilities')
const sizeInBytes=utils.sizeInBytes;
const MailSender=utils.MailSender;
const bcrypt= require('bcryptjs');
const validator= require ('validator');
const jwt=require('jsonwebtoken')
var fs = require('fs');

require('dotenv').config()

function checkPassword(passwordPlainText){
    //add all password conditions&limitations
    if(passwordPlainText.length<6)
       return false
    if(sizeInBytes(passwordPlainText)>72)
        return false
    
    return true
}
function checkSignupInfo(req,res,username,email,passwordPlainText){
    // handling registration erros
    if(username===undefined||passwordPlainText===undefined||email===undefined){
        res.status(400).json({
            message: "missing data",
        })    
        return false
    }
    
    if(!validator.isEmail(email)){
        res.status(400).json({
            message: "invalid email address",
            })
        return false            
    }
    

    if(!checkPassword(passwordPlainText))
        {res.status(400).json({
        message: "password is either too short or too long (must be >6 letters)",
       })
       return false
    }
    return true
}

function createUser(req,res,username,email,passwordPlainText){
    /*
    creates user at the database and sends confirmation email, 
    */
    bcrypt.hash(passwordPlainText, 10, (err, hash)=>{
        
        const registrationConfirmer=new MailSender(process.env.SMTP_HOST,process.env.SMTP_PORT,false,process.env.APP_EMAIL,process.env.APP_PASSWORD)
        const cofirmationToken=jwt.sign({},process.env.CONFIRMATION_JWT_KEY,{expiresIn:utils.REGISTRATION_TIMEOUT_SECS})
        
        registrationConfirmer.sendHTMLMail(email,"Confirm Registration",
        fs.readFileSync(__dirname+'\\..\\utils\\confirm_registration.html').toString().replace('{myJWT}',cofirmationToken).replace('{expiration_time}',utils.REGISTRATION_TIMEOUT_MINS))    
        
        User.create({username:username,email:email,password:hash}).
        then(user=>{
            Token.create({userId:user._id,token:cofirmationToken}).then(()=>{
            return res.status(200).json({
                message: "User successfully created,check your email to confirm registration",
                 user:user.id,
              })
            })
        })
        .catch(err=>{
            console.log(err);
            return res.status(400).json({
                message: "User couldn't be created",
              })
        })

      
    });
}


exports.confirmRegistration=async  (req,res)=>{

    const reqtoken=req.query.token;
    const tokenUserPair= await Token.findOne({token:reqtoken})

    if(!tokenUserPair)
        return res.status(401).json({ message: "Request Expired" })
    
    await jwt.verify(tokenUserPair.token,process.env.CONFIRMATION_JWT_KEY, async(err,decodedvalues)=>{
        if (err)
            {

                const user=User.findOne({_id:tokenUserPair.userId})

                if (user){
                    if(user.confirmed){
                        console.trace("Shouldn't reach here")
                        return res.status(200).json({ message: "user already confirmed" });
                    }
                    else{
                        //user is not confirmed and the JWT is expired
                        User.findByIdAndDelete(tokenUserPair.userId).catch(err=>console.log(err))
                        Token.deleteOne({token:reqtoken}).catch(err=>console.log(error))
                        return res.status(401).json({ message: "request expired, register again" });
                    }
                }else{
                    console.trace("Shouldn't reach here")
                    Token.deleteOne({token:reqtoken}).catch(err=>console.log(error))
                    return res.status(401).json({ message: "no such user exists" });
                }
            }
        else{
            //token is valid 
            User.updateOne({_id:tokenUserPair.userId},{confirmed:true},function (err, docs){
                if (err){
                    console.log(err)
                }
                 })
            Token.deleteOne({token:reqtoken}).catch(err=>console.log(error))

            return res.status(200).json({ message: "resgistration confirmed" });
        }
    })
    
}

exports.register= async (req,res)=>{
    const username=req.body.username;
    const passwordPlainText=req.body.password;
    const email=req.body.email;
    
   
    if(!checkSignupInfo(req,res,username,email,passwordPlainText))
        return

    User.findOne({username:username,email:email}).then(async (user)=>{
        if (user){
            if (user.confirmed)
                {return  res.status(400).json({
                    message: "username or email already confirmed and in use",
                })
            }
            else{
            const tokenUserPair= await Token.findOne({userId:user._id})
            
            if (tokenUserPair)
            {   
                jwt.verify(tokenUserPair.token,process.env.CONFIRMATION_JWT_KEY, async(err,decodedvalues)=>{
                    if (err)
                        {
                        User.findByIdAndDelete(tokenUserPair.userId).then(()=>
                        Token.findByIdAndDelete(tokenUserPair._id)).then(()=>{
                            return createUser(req,res,username,email,passwordPlainText);}).catch(err=>console.log('???'+error))
                        }
                    else{
                        return  res.status(200).json({
                            message: "User already registered, check your email for confirmation",
                        })      
                    }
                })
            }
            }
        }else{
            User.findOne({$or :[{username:username},{email:email}]}).then(async (user)=>{
                if (user)
                return  res.status(400).json({
                    message: "username or email already in use",
                })
                
                return createUser(req,res,username,email,passwordPlainText)
                
                })
        }
    })


    
}

exports.login = async(req,res,next)=>{
    const email=req.body.email;
    const passwordPlainText=req.body.password;
    await User.findOne({email:email}).then( async user=>{
    if (!user){
        return res.status(400).json({
            message:"invalid email"
        })
    }
    if(! await bcrypt.compare(passwordPlainText,user.password)){
        return res.status(400).json({
            message:"invalid password"
        })
    }
    if(~user.confirmed){
        return res.status(400).json({
            message:"This account isn't confirmed, check your email"
        })   
    }

    const token= jwt.sign({id:user._id, role:user.role,username:user.username},process.env.JWT_KEY,{expiresIn:utils.LOGIN_TIMEOUT_SECS});
    return res.cookie('jwt',token,utils.LOGIN_TIMEOUT_MILLIS).status(200).json(
        {
            message: "User signed in succesfully",
            user:user._id
        }
    )}).catch(error=>{
        res.status(400).json({
            message: "An error occurred",
            error: error.message,
          });
    })

    
    
}

exports.logout =(req,res,next)=>{  
    const token=req.cookies.jwt;
    if(!token)
        return res.status(401).json({ message: "Not authorized, token not available" })
    
    jwt.verify(token,process.env.JWT_KEY,(err,decodedvalues)=>{
        if (err)
            return res.status(401).json({ message: "token invalid" });
        res.cookie("jwt", "", { maxAge: "1" }).redirect("/")

    })
}

exports.resetPassword=(req,res)=>{
    const email=req.body.email;
    User.findOne({email:email}).then((user)=>{
        if (user){
            const PasswordResetSender=new MailSender(process.env.SMTP_HOST,process.env.SMTP_PORT,false,process.env.APP_EMAIL,process.env.APP_PASSWORD)
            const resetToken=jwt.sign({email:email,password:user.password},process.env.RESET_JWT_KEY,{expiresIn:utils.PASSWORD_RESET_TIMEOUT_SECS})
            
            PasswordResetSender.sendHTMLMail(email,"Reset Password",
            fs.readFile(__dirname+'\\..\\utils\\reset_password.html').toString().replace('{myJWT}',resetToken).replace('{expiration_time}',utils.PASSWORD_RESET_TIMEOUT_MINS)).then(()=>{
                return res.status(200).json({
                    message:"email sent"
                })  
            
            })
            
        }else{
            return res.status(400).json({
                message:"make sure to enter a valid"
            })  
        }
    })
}

exports.changePassword=async(req,res)=>{
    const newPassword=req.body.password;
    const confirm_newPassword=req.body.confirm_password
    const confirmationToken=req.body.token
    if(newPassword!==confirm_newPassword){
        return res.status(400).json({
            message:"passwords are not the same"
        })   
    }
    if(!checkPassword(newPassword)){
        return res.status(400).json({
            message:"password is either too short or to long (must be >6 letters)"
        })  
    } 

    await jwt.verify(confirmationToken,process.env.RESET_JWT_KEY, (err,decodedvalues)=>{
        if(err){
            return res.status(400).json({
                message:"request Expired"
            })    
        }else{
            User.findOne({email:decodedvalues.email}).then(
                user=>{if(user.password===decodedvalues.password){
                    bcrypt.hash(newPassword, 10, (err, hash)=>{
    
                        User.updateOne({email:decodedvalues.email},{password:hash}).then(()=>{
                            return res.status(200).json({
                                message:"password changed succesfully"
                            })    
                        })
                        
                        
                    })
                }else{
                    return res.status(200).json({
                        message:"password has already been changed once"
                    })    
                }}
            )
            
        }
})
    

}



