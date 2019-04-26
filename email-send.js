var nodemailer = require('nodemailer');
var hbs        = require('nodemailer-handlebars');

var transporter = nodemailer.createTransport({
		host: 'smtp.mail.ru',
		secure: true,
  		auth: {
    		user: 'support@dagp.ru',
    		pass: 'Cronos1123'
  		}
});

transporter.use('compile', hbs({
    viewEngine: 'express-handlebars',
    viewPath: 'app/views_mail'
}));

function Email(username, email, type_problem, description_problem){
	this.username = username;
	this.email = email;
	this.type_problem = type_problem;
	this.description_problem = description_problem;

	this.sendMails = function(){
		var mailToUser = {
  			from: 'support@dagp.ru',
  			to: this.email,
  			subject: 'Фиксация проблемы веб-сервиса' + " <"+this.type_problem+">",
  			template: 'index',
  			context: {
  				username: this.username
  			}
		};

		var mailToAdmin = {
			from: 'support@dagp.ru',
			to: 'i.manihin@dagp.ru',
			subject: 'Фиксация проблемы веб-сервиса' + " <"+this.type_problem+">",
			html: 'Пользователь '+this.username+' обнаружил проблему в работоспособности веб-сервиса, связанную с '+
			'\"'+this.type_problem+'\".'+'<br><br>'+'Ниже привидено описание проблемы:'+'<br>'+this.description_problem
		};

		transporter.sendMail(mailToUser);
		transporter.sendMail(mailToAdmin);
	}

}

module.exports = Email; 