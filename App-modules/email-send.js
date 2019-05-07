var nodemailer = require('nodemailer');
var hbs        = require('nodemailer-handlebars');

var transporter = nodemailer.createTransport({
		host: 'smtp.mail.ru',
		secure: true,
  		auth: {
    		user: 'support@dagp.ru',
    		pass: 'Al2805197103041970'
  		}
});

transporter.use('compile', hbs({
    viewEngine: 'express-handlebars',
    viewPath: 'app/views_mail'
}));

function Mails(email){ 
	this.email = email;
	
	this.send_Mails_To_Support_And_User = function(username, type_problem, description_problem){
		var mailToUser = {
  			from: 'support@dagp.ru',
  			to: this.email,
  			subject: 'Фиксация проблемы веб-сервиса' + " <"+type_problem+">",
  			template: 'support',
  			context: {
  				username: username
  			}
		};

		var mailToAdmin = {
			from: 'support@dagp.ru',
			to: 'i.manihin@dagp.ru',
			subject: 'Фиксация проблемы веб-сервиса' + " <"+type_problem+">",
			html: 'Пользователь '+username+' обнаружил проблему в работоспособности веб-сервиса, связанную с '+
			'\"'+type_problem+'\".'+'<br><br>'+'Ниже привидено описание проблемы:'+'<br>'+description_problem
		};

		transporter.sendMail(mailToUser);
		transporter.sendMail(mailToAdmin);
	}

	this.Send_Mail_About_Change_Password = function(password){
		var mailToUser = {
  			from: 'support@dagp.ru',
  			to: this.email,
  			subject: 'Изменение пароля от личного аккаунта',
  			template: 'changePassword',
  			context: {
  				password: password
  			}
		};

		transporter.sendMail(mailToUser);
	}

}

module.exports = Mails;