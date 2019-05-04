// Required Modules
const express    = require('express');
const { check } = require('express-validator/check');
const System = require('./App-modules/System-functions');
const AdminPrivileges = require('./App-modules/Admin-privileges');
const signup_signin = require('./App-modules/signup-signin');
const accountSettings = require('./App-modules/accountSettings');
const bodyParser = require('body-parser');
const moment     = require('moment');
var app        = express(); 

var port = process.env.PORT || 3000;

//Скрываем информацию об ПО, на котором был написан сервер
app.disable('x-powered-by');

//locale russian language
moment.locale('ru');

app.use('/media', express.static(__dirname + "/media"));
app.use(express.static(__dirname + "/app"));
app.use(bodyParser.json({limit: "100mb", type:'application/json'}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, type:'application/json'}));



app.get('/getListUsers/:id', AdminPrivileges.getListUsers)
app.get('/check/:id', System.check);
app.get('/getUserInfo/:id', accountSettings.getUserInfo);
app.get('/getHistoryUser/:id', accountSettings.getHistoryUser)
app.get('/getHistoryVisitsUser', AdminPrivileges.getHistoryVisitsUser)
app.get("/getStatisticsOfUseFunctional", AdminPrivileges.getStatisticsOfUseFunctional)


app.post("/registration", [
		check('username')
			.exists().withMessage('Укажите имя пользователя')
			.not().isEmpty().withMessage('Укажите имя пользователя')
			.matches("^[A-Za-z0-9А-Яа-я]+$").withMessage('Имя пользователя содержит недопустимые символы'),
		check('email')
			.exists().withMessage('Укажите адрес электронной почты')
			.not().isEmpty().withMessage('Укажите адрес электронной почты')
			.isEmail().withMessage('Неверно указан адрес электронной почты')
			.normalizeEmail(),
		check('date')
			.exists().withMessage('Укажите дату рождения')
			.not().isEmpty().withMessage('Укажите дату рождения')
			.isISO8601().withMessage('Дата рождения указана неверно'),
		check('city')
			.exists().withMessage('Укажите город')
			.not().isEmpty().withMessage('Укажите город')
			.isAlpha('ru-RU').withMessage('Нзавание города должно включать в себя только буквы русского алфавита')
			.isLength({min:3}).withMessage('Название города не соответствует минимальной длине (минимум 3 символа)')
			.isLength({max:20}).withMessage('Название города превышает максимальную длину (максимум 20 символов)'),
		check('password')
			.exists().withMessage('Укажите пароль')
			.not().isEmpty().withMessage('Укажите пароль')
			.isAlphanumeric().withMessage('Пароль содержит недопустимые символы')
			.isLength({min:5}).withMessage('Длина пароля должна быть не менее 5-ти символов'),
	], signup_signin.signup)

app.post("/autorization", [
		check('username')
			.exists().withMessage('Введите имя пользователя<br>(или адрес электронной почты)')
			.not().isEmpty().withMessage('Введите имя пользователя<br>(или адрес электронной почты)')
			.matches('(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)|(^[A-Za-z0-9А-Яа-я]+$)').withMessage('Поле содержит недопустимые символы'),
		check('password')
			.exists().withMessage('Введите пароль')
			.not().isEmpty().withMessage('Введите пароль')
	], signup_signin.signin);

app.post("/recoveryPassword", [
		check('email')
			.exists().withMessage('Укажите адрес электронной почты')
			.not().isEmpty().withMessage('Укажите адрес электронной почты')
			.isEmail().withMessage('Неверно указан адрес электронной почты')
			.normalizeEmail(),
		check('password')
			.exists().withMessage('Укажите новый пароль')
			.not().isEmpty().withMessage('Укажите новый пароль')
			.isAlphanumeric().withMessage('Новый пароль содержит недопустимые символы')
			.isLength({min:5}).withMessage('Длина пароля должна быть не менее 5-ти символов')	
], signup_signin.recoveryPassword)

app.post("/support", [
		check('username')
			.exists().withMessage('Укажите имя пользователя')
			.not().isEmpty().withMessage('Укажите имя пользователя')
			.matches("^[A-Za-z0-9А-Яа-я]+$").withMessage('Имя пользователя содержит недопустимые символы'),
		check('email')
			.exists().withMessage('Укажите адрес электронной почты')
			.not().isEmpty().withMessage('Укажите адрес электронной почты')
			.isEmail().withMessage('Неверно указан адрес электронной почты')
			.normalizeEmail(),
		check('type_problem')
			.exists().withMessage("Выберите тип проблемы")
			.not().isEmpty().withMessage("Выберите тип проблемы"),
		check('description_problem')
			.exists().withMessage('Не указано описание проблемы')
			.not().isEmpty().withMessage('Не указано описание проблемы')
	], System.support);

app.post("/saveDataHistory", System.saveDataHistory)

app.put("/account/updateUserInfo", [
		check('username')
			.exists().withMessage('Укажите имя пользователя')
			.not().isEmpty().withMessage('Укажите имя пользователя')
			.matches("^[A-Za-z0-9А-Яа-я]+$").withMessage('Имя пользователя содержит недопустимые символы'),
		check('date_birth')
			.exists().withMessage('Укажите дату рождения')
			.not().isEmpty().withMessage('Укажите дату рождения')
			.isISO8601().withMessage('Дата рождения указана неверно'),
		check('city')
			.exists().withMessage('Укажите город')
			.not().isEmpty().withMessage('Укажите город')
			.isAlpha('ru-RU').withMessage('Нзавание города должно включать в себя только буквы русского алфавита')
			.isLength({min:3}).withMessage('Название города не соответствует минимальной длине (минимум 3 символа)')
			.isLength({max:20}).withMessage('Название города превышает максимальную длину (максимум 20 символов)')
], accountSettings.updateUserInfo)

app.put("/account/change-email", [
		check('email')
			.exists().withMessage('Укажите адрес электронной почты')
			.not().isEmpty().withMessage('Укажите адрес электронной почты')
			.isEmail().withMessage('Неверно указан адрес электронной почты')
			.normalizeEmail()
], accountSettings.changeEmail)

app.put("/account/change-password", [
		check('password')
			.exists().withMessage('Укажите пароль')
			.not().isEmpty().withMessage('Укажите пароль')
			.isAlphanumeric().withMessage('Введённый пароль содержит недопустимые символы')
			.isLength({min:5}).withMessage('Длина пароля должна быть не менее 5-ти символов')
], accountSettings.changePassword)

app.put("/changeUserPassword", [
		check('username')
			.exists().withMessage('Выберите пользователя')
			.not().isEmpty().withMessage('Выберите пользователя')
			.matches("^[A-Za-z0-9А-Яа-я]+$").withMessage('Имя пользователя содержит недопустимые символы'),
		check('password')
			.exists().withMessage('Введите новый пароль для пользователя')
			.not().isEmpty().withMessage('Введите новый пароль для пользователя')
			.isAlphanumeric().withMessage('Введённый пароль содержит недопустимые символы')
			.isLength({min:5}).withMessage('Длина пароля должна быть не менее 5-ти символов')
	], AdminPrivileges.changeUserPassword)

app.put("/account/profile/changeImage", accountSettings.changeImage)


app.use(function(req, res){
 	 res.sendFile('/app/index.html', { root: __dirname }); 
});

// Start Server
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});