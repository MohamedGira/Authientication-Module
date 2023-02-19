# Authientication Module
A full Authnetication Authorization module with email confirmation and password reset features. implementation flow can be found [Here](./docs/readme.md).

## Dependinces
* You can find all needed modules in `package.json`.
use

```
npm install
```
* You must have mongoDB installed and running to your client. or you can change the database configuration from */models/db.js* to connect to an online database

* You can and must change the secret keys such as found at the `.env` file.
* Check [nodemailer](https://nodemailer.com/about/) documentation to configure the application email. this [article](https://wpmailsmtp.com/gmail-less-secure-apps/#Option_2_Use_an_App_Password) will guide you through allowing the configured gmail account to send emails
  
___
## Usage
The authentication methods found [here]() can be used as follows.
### register
This method accepts 3 parameters (username, email, password)in a POST request. do the necessary validations and constraints via ```checkSignupInfo```, ```checkPassword``` methods, registers the user in the DB, and sends a confirmation email to the user via ```MailSender``` class.

### confirmRegistration
Receives a JWT from the request query, validates it, and confirms account registration on success. on failure due to JWT time expirey, it deletes the unconfirmed account and its corresponding confirmation JWT from the database.

### login
This method accepts 2 parameters (email, password)in a POST request. checks if the user is valid, and check account's Status (Confirmed or not). signs the user in and sends an authorization JWT in a cookie to the client.

### logout
Logs out the user and destroys the Cookie that holds the JWT.

### resetPassword
Takes one parameter (email) in a POST request, checks it against the DB and if found sends a Reset password email to the requested user via ```MailSender``` class, within this email is sent a single-use JWT.

### changePassword
Receives 3 parameters (JWT, newPassword, newPasswordConfirmation), checks and validates the token, if valid it checks and validates the passwords via ```checkPassword``` method, if all is well, the password is changed and a success response is sent to the client

___
All the methods handle failure by sending a suitable HTTP status to the client



