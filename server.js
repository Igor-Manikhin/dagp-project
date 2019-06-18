// Required Modules
const express    = require('express');
const { check } = require('express-validator/check');
const jwt        = require('jsonwebtoken');
const pg         = require('pg');
const file       = require('fs');
const Canvas = require('canvas');
const System = require('./App-modules/System-functions');
const AdminPrivileges = require('./App-modules/Admin-privileges');
const signup_signin = require('./App-modules/signup-signin');
const accountSettings = require('./App-modules/accountSettings');
const tf = require('@tensorflow/tfjs');
const bodyParser = require('body-parser');
const moment     = require('moment');
var app        = express(); 
let model_age; 
let model_gender;


//Соединение с БД
var config = {
    user: 'admin',
    database: 'userdb',
    password: 'admin',
    port: 5432
};

var publicKey = file.readFileSync('Security_Keys/rsa-public-key.pem');
var pool = new pg.Pool(config);

var port = process.env.PORT || 3000;

//Скрываем информацию об ПО, на котором был написан сервер
app.disable('x-powered-by');

//locale russian language
moment.locale('ru');

app.use('/media', express.static(__dirname + "/media"));
app.use(express.static(__dirname + "/app"));
app.use(bodyParser.json({limit: "100mb", type:'application/json'}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, type:'application/json'}));


function age_group(age){
            
    var groups = ["Детская", "Подростковая", "Юношеская", "Взрослая","Зрелая", "Пожилая"];
    var ages_groups = [[0, 12],[13, 18],[19, 25],[26, 40], [41, 55], [56, 75]]; 
    var group_age;

    for(var i = 0; i < ages_groups.length; i++){
        var j = 0;
        if(age>=ages_groups[i][j] && age<=ages_groups[i][j+1]){
              group_age = groups[i];
              return group_age;
        }
    }
}


async function loadModel(){
	model_age = await tf.loadLayersModel('http://www.dagp.ru/Neural_networks/age/model.json'); 
	model_gender = await tf.loadLayersModel('http://www.dagp.ru/Neural_networks/gender/model.json');
}
loadModel();


//Маршруты  
app.get('/getListUsers/:id', AdminPrivileges.getListUsers)
app.get('/check/:id', System.check);
app.get('/getUserInfo/:id', accountSettings.getUserInfo);
app.get('/getHistoryUser/:id', accountSettings.getHistoryUser)
app.get('/getHistoryVisitsUser', [
	check('username')
		.exists().withMessage('Укажите имя пользователя')
		.not().isEmpty().withMessage('Укажите имя пользователя')
		.matches("^[A-Za-z0-9А-Яа-я]+$").withMessage('Имя пользователя содержит недопустимые символы')
], AdminPrivileges.getHistoryVisitsUser)
app.get("/getStatisticsOfUseFunctional", AdminPrivileges.getStatisticsOfUseFunctional)

app.post("/determination", function(req, res){
	var token = req.body.id;
	let data = {}
	var class_names = ["Женский", "Мужской"];
	let ages = tf.range(0, 117);
	let prediction_age;
    let prediction_gender;
	var image = new Canvas.Image();
	var canvas = Canvas.createCanvas(150,150);
	var context = canvas.getContext('2d');
	image.onload = () => {
			context.drawImage(image, 0, 0, 150, 150);
    }
	image.src = req.body.photoURL;
	let tensor = tf.browser.fromPixels(canvas)
                      .resizeNearestNeighbor([150,150])   
                      .toFloat()
                      .expandDims();
    tensor = tensor.div(tf.scalar(255));
    prediction_age = model_age.predict(tensor);
    prediction_gender = model_gender.predict(tensor);
    prediction_age = prediction_age.dot(ages).flatten();
    prediction_age.data().then(X => {
    	let age = parseFloat(X[0].toFixed());
    	data.age = age;
    	data.age_group = age_group(age);
    	prediction_gender.argMax(1).data().then(X => {
    		data.gender = class_names[X[0]]

    		jwt.verify(token, publicKey, function(err, decoded){
				if(err){
					return console.log("Token is not verifyed!");
				}
		
				var reqExp = new RegExp("^data:" + req.body.type_file + ";base64,");
				var base64Data = req.body.photoURL.replace(reqExp, "");
				file_path = "media/" + decoded.username + "/determ_history/" + req.body.name_file;
				file.writeFileSync(file_path, base64Data, 'base64');

				pool.connect(function(err, client, done){
					client.query("INSERT INTO history_determ (user_id, age_determ, age_group_determ, gender_determ, photo_used_determ) VALUES ($1, $2, $3, $4, $5)", 
						[decoded.id, age, data.age_group, data.gender, file_path], function(err, result){
							if(err){
								return console.log("Bad request!");
							}
							client.query("UPDATE statistics_of_functional_use SET count_use_function_determ=count_use_function_determ+1 WHERE user_id=$1", [decoded.id], 
							function(err, result){
								if(err){
									return console.log("Bad request!");
								}
								done();
								res.send(data);
							})
					})
				});
		  	})
       });                                         
    });  
});

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