const MongooseDbManager = require("../models/mongoManager");
const utils = require("../utils/utilities");
const sizeInBytes = utils.sizeInBytes;
const MailSender = require('../utils/MailSender');
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const  MError =  require('../utils/AppError');
var fs = require("fs");
const { promisify } = require("util");
const { resolve } = require("path");

require("dotenv").config();

function checkPassword(passwordPlainText) {
  //add all password conditions&limitations
  if (passwordPlainText.length < 6) return false;
  if (sizeInBytes(passwordPlainText) > 72) return false;

  return true;
}
function checkSignupInfo(req, res, username, email, passwordPlainText) {
  /*returns null if passed*/
  // handling registration erros
  if (
    username === undefined ||
    passwordPlainText === undefined ||
    email === undefined
  ) {
    /* res.status(400).json({
      message: "missing data",
    });
    return false */
    return new MError(400, "missing data");
  }

  if (!validator.isEmail(email)) {
    return new MError(400, "invalid email address");
  }

  if (!checkPassword(passwordPlainText)) {
    return new MError(
      400,
      "password is either too short or too long (must be >6 letters)"
    );
  }
  return null;
}

const catchAsync= (fn)=>{
return(req,res,next)=>{
  fn(req,res,next).catch(err=>next)
} 
}

async function createUser(req, res, username, email, passwordPlainText) {
  //returns promise =>true
  /*
  creates user at the database and sends confirmation email, 
  */
  try{
  const hash= await promisify(bcrypt.hash)(passwordPlainText, 10)
  const registrationConfirmer = new MailSender(
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    false,
    process.env.APP_EMAIL,
    process.env.APP_PASSWORD
  );
  const cofirmationToken = jwt.sign({}, process.env.CONFIRMATION_JWT_KEY, {
    expiresIn: utils.REGISTRATION_TIMEOUT_SECS,
  });
  await registrationConfirmer.sendHTMLMail(
    email,
    "Confirm Registration",
    fs
      .readFileSync(__dirname + "\\..\\utils\\confirm_registration.html")
      .toString()
      .replace("{myJWT}", cofirmationToken)
      .replace("{expiration_time}", utils.REGISTRATION_TIMEOUT_MINS)
  );

  const user = await MongooseDbManager.User.create({
    username: username,
    email: email,
    password: hash,
  });
  await MongooseDbManager.Token.create({
    userId: user._id,
    token: cofirmationToken,
  });
  return true;

}catch(err){
  return err;
}
}




exports.isLoggedIn = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) return next();
  return jwt.verify(token, process.env.JWT_KEY, (err, decodedvalues) => {
    if (err) {
      console.log("fromhere");
      throw err;
    }
    if (decodedvalues.username)
      return next(new MError(400, "a user is already logged in"));
    else return next();
  });
};

exports.confirmRegistration = async (req, res, next) => {
  const reqtoken = req.query.token;
  const tokenUserPair = await MongooseDbManager.Token.findOne({
    token: reqtoken,
  });

  if (!tokenUserPair) {
    return next(new MError(201, "Request Expired"));
  }

  jwt.verify(
    tokenUserPair.token,
    process.env.CONFIRMATION_JWT_KEY,
    async (err, decodedvalues) => {
      if (err) {
        const user = MongooseDbManager.User.findOne({
          _id: tokenUserPair.userId,
        });

        if (user) {
          if (user.confirmed) {
            console.trace("Shouldn't reach here");
            return res.status(200).json({ message: "user already confirmed" });
          } else {
            //user is not confirmed and the JWT is expired
            MongooseDbManager.User.findByIdAndDelete(
              tokenUserPair.userId
            ).catch((err) => console.log(err));
            MongooseDbManager.Token.deleteOne({ token: reqtoken }).catch(
              (err) => console.log(error)
            );
            return next(new MError(201, "request expired, register again"));
          }
        } else {
          console.trace("Shouldn't reach here");
          MongooseDbManager.Token.deleteOne({ token: reqtoken }).catch((err) =>
            console.log(error)
          );
          return next(new MError(201, "no such user exists"));
        }
      } else {
        //token is valid
        MongooseDbManager.User.updateOne(
          { _id: tokenUserPair.userId },
          { confirmed: true },
          (err, docs) => {
            if (err) {
              console.log(err);
            }
          }
        );
        MongooseDbManager.Token.deleteOne({ token: reqtoken }).catch((err) =>
          console.log(error)
        );
        return res.status(200).json({ message: "resgistration confirmed" });
      }
    }
  );
};

exports.register = async (req, res, next) => {
 
  const username = req.body.username;
  const passwordPlainText = req.body.password;
  const email = req.body.email;

  let invalid = checkSignupInfo(req, res, username, email, passwordPlainText);
  if (invalid) {
    return next(invalid);
  }
  

  const user = await MongooseDbManager.User.findOne({
    username: username,
    email: email,
  });
  //not already registered
  if (!user) {
    //check if these inputs are not unique
    const user = await MongooseDbManager.User.findOne({
      $or: [{ username: username }, { email: email }],
    });
    if (user)
      return next(new MError(409, "username or email already in use"));

    const usercreatedSuccessfully = await createUser(req, res, username, email, passwordPlainText)
    if (usercreatedSuccessfully !== true) {
      return next(usercreatedSuccessfully);
    }
    return res.status(200).json({
      message:
        "User successfully created,check your email to confirm registration",
      
    });
  } else {
    //this user is in the database he might be not confirmed

    if (user.confirmed)
      return next(new MError(400, "username or email already confirmed and in use"));

    //this user is confirmed

    const tokenUserPair = await MongooseDbManager.Token.findOne({
      userId: user._id,
    });

    if (tokenUserPair) {
      return jwt.verify(
        tokenUserPair.token,
        process.env.CONFIRMATION_JWT_KEY,
        async (err, decodedvalues) => {
          if (err) {
            try {
              await MongooseDbManager.User.findByIdAndDelete(
                tokenUserPair.userId
              );
              await MongooseDbManager.Token.findByIdAndDelete(tokenUserPair._id);
              const usercreatedSuccessfully = await createUser(req, res, username, email, passwordPlainText)
              if (usercreatedSuccessfully !== true) {
                return next(usercreatedSuccessfully);
              }
              return res.status(200).json({
                message:
                  "User successfully created,check your email to confirm registration",
              });

            } catch (err) {
               return err
            }
          } else {
            return res.status(200).json({
              message:
                "User already registered, check your email for confirmation",
            });
          }
        }
      );
    }
  }
};

  exports.login = async (req, res, next) => {
    try {
      const email = req.body.email;
      const passwordPlainText = req.body.password;
      const user = await MongooseDbManager.User.findOne({ email: email });

      if (!user) {
        return next(new MError(400, "invalid email"));
      }
      const compare = await bcrypt.compare(passwordPlainText, user.password);
      if (!compare) {
        return next(new MError(400, "invalid password"));
      }
      if (!user.confirmed) {
        return next(
          new MError(401, "This account isn't confirmed, check your email")
        );
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, username: user.username },
        process.env.JWT_KEY,
        { expiresIn: utils.LOGIN_TIMEOUT_SECS }
      );
      return res
        .cookie("jwt", token, utils.LOGIN_TIMEOUT_MILLIS)
        .status(200)
        .json({
          message: "User signed in succesfully",
          user: user._id,
        });
    } catch (error) {
      return next(new MError(401, error.message));
    }
  };

  exports.logout = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return next(new MError(401, "Not authorized, token not available"));

    jwt.verify(token, process.env.JWT_KEY, (err, decodedvalues) => {
      if (err) return next(new MError(401, "invalid token"));
      res.cookie("jwt", "", { maxAge: "1" }).redirect("/");
    });
  };

  exports.resetPassword = async (req, res, next) => {
    const email = req.body.email;
    const user = await MongooseDbManager.User.findOne({ email: email });

    if (!user) {
      return next(new MError(401, "make sure to enter a valid email"));
    }else if (user.confirmed)
    {
      
    const PasswordResetSender = new MailSender(
      process.env.SMTP_HOST,
      process.env.SMTP_PORT,
      false,
      process.env.APP_EMAIL,
      process.env.APP_PASSWORD
    );

    const resetToken = jwt.sign(
      { email: email, password: user.password },
      process.env.RESET_JWT_KEY,
      { expiresIn: utils.PASSWORD_RESET_TIMEOUT_SECS }
    );
    try {
      await PasswordResetSender.sendHTMLMail(
        email,
        "Reset Password",
        fs
          .readFileSync(__dirname + "\\..\\utils\\reset_password.html")
          .toString()
          .replace("{myJWT}", resetToken)
          .replace("{expiration_time}", utils.PASSWORD_RESET_TIMEOUT_MINS)
      );
      return res.status(200).json({
        message: "email sent",
      });
    } catch (err) {
      return next(err);
    }}else{
      return next(new MError(401, "Account is not confirmed,rerigester later"));
    }
  };

  exports.changePassword = async (req, res, next) => {
    const newPassword = req.body.password;
    const confirm_newPassword = req.body.confirm_password;
    const confirmationToken = req.body.token;
    if (newPassword !== confirm_newPassword) {
      return next(new MError(400, "passwords are not the same"));
    }
    if (!checkPassword(newPassword)) {
      return next(
        new MError(
          400,
          "password is either too short or to long (must be >6 letters)"
        )
      );
    }

    jwt.verify(
      confirmationToken,
      process.env.RESET_JWT_KEY,
      async (err, decodedvalues) => {
        if (err) {
          return next(new MError(201, "request Expired"));
        }
        const user = await MongooseDbManager.User.findOne({
          email: decodedvalues.email,
        });

        if (user.password === decodedvalues.password) {
          try {
            
            const hash = await promisify(bcrypt.hash)(newPassword, 10);
            await MongooseDbManager.User.updateOne(
              { email: decodedvalues.email },
              { password: hash }
            );
            return res.status(200).json({
              message: "password changed succesfully",
            });
          } catch (err) {
              return next(err);
          }
        } else {
          
          return res.status(200).json({
            message: "password has already been changed once",
            
          });
        }
      }
    );
  };
