const nodemailer = require("nodemailer");
exports.sizeInBytes= (string)=>{return Buffer.from(string).length}
const inLineCss=require('nodemailer-juice')
exports.MailSender =class MailSender{
    constructor(host,port,secure,user,pass){
        this.transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure, // true for 465, false for other ports
            auth: {
              user: user,
              pass: pass
            },
          });
          
          this.sendTextMail=async (to,subject,text)=>{
            try{
            // send mail with defined transport object
            let info = await this.transporter.sendMail({
              from: this.user, // sender address
              to: to,
              subject: subject,
              text: text, // plain text body
            });
          
            console.log("Message sent: %s", info.messageId);
        }catch(err){
            console.log("somthing went wrong "+ err.message);
        }
        }
        this.sendHTMLMail=async (to,subject,htmlbody)=>{
            try{
            // send mail with defined transport object
            await this.transporter.use('compile', inLineCss());
            let info = await this.transporter.sendMail({
              from: this.user, // sender address
              to: to,
              subject: subject,
              html: htmlbody, // html body
            });
          
            console.log("Message sent: %s", info.messageId);
        }catch(err){
            console.log("somthing went wrong "+ err.message);
        }
        }
   
    }
}

exports.ErrorWrapper=(status,statusCode,message,source='')=>{
  var err=new Error(message);
  err.status=status;
  err.statusCode=statusCode;
  err.source=source
  return err
}


exports.REGISTRATION_TIMEOUT_HOURS=1
exports.REGISTRATION_TIMEOUT_MINS=exports.REGISTRATION_TIMEOUT_HOURS*60
exports.REGISTRATION_TIMEOUT_SECS=exports.REGISTRATION_TIMEOUT_HOURS*3600
exports.REGISTRATION_TIMEOUT_MILLIS=exports.REGISTRATION_TIMEOUT_MINS*3600000

exports.PASSWORD_RESET_TIMEOUT_HOURS=1/6
exports.PASSWORD_RESET_TIMEOUT_MINS=exports.REGISTRATION_TIMEOUT_HOURS*60
exports.PASSWORD_RESET_TIMEOUT_SECS=exports.REGISTRATION_TIMEOUT_HOURS*3600
exports.PASSWORD_RESET_TIMEOUT_MILLIS=exports.REGISTRATION_TIMEOUT_MINS*3600000

exports.LOGIN_TIMEOUT_HOURS=1
exports.LOGIN_TIMEOUT_MINS=exports.LOGIN_TIMEOUT_HOURS*60
exports.LOGIN_TIMEOUT_SECS=exports.LOGIN_TIMEOUT_HOURS*3600
exports.LOGIN_TIMEOUT_MILLIS=exports.LOGIN_TIMEOUT_HOURS*3600000  
