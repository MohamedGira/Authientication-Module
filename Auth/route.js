const express= require('express')
const router=express.Router()
const Auth=require('./Auth')
require('dotenv').config()

const EmailSender=require('../utils/utilities').MailSender

router.route('/register').post(Auth.register)
router.route('/confirm').get(Auth.confirmRegistration)

router.route('/login').post(Auth.login)
router.route('/logout').post(Auth.logout)
module.exports =router