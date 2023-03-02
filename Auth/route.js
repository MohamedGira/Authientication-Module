const express= require('express')
const router=express.Router()
const Auth=require('./Auth')
require('dotenv').config()

const EmailSender=require('../utils/utilities').MailSender

router.route('/register').post(Auth.isLoggedIn,Auth.register)
router.route('/confirm').get(Auth.confirmRegistration)
router.route('/resetreq').post(Auth.isLoggedIn,Auth.resetPassword)
router.route('/reset').post(Auth.changePassword)
router.route('/login').post(Auth.isLoggedIn,Auth.login)
router.route('/logout').post(Auth.logout)
module.exports =router