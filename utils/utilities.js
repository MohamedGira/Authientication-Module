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
            this.transporter.use('compile', inLineCss());
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
const Errorlist={
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  422: "Unprocessable Entity",
  425: "Too Early",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
  103: "Early Hints",
  421: "Misdirected Request",
  426: "Upgrade Required",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required"
}
exports.ErrorWrapper=(statusCode,message,source='')=>{
  var err= new Error(message);
  err.statusCode=statusCode;
  err.status=Errorlist[statusCode];
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
