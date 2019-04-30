// Required Modules
var express    = require('express');
const { check, validationResult } = require('express-validator/check');
var jwt        = require('jsonwebtoken');
var pg         = require('pg');
var file       = require('fs');
var email      = require('./email-send');
var bodyParser = require('body-parser');
var moment     = require('moment');
var app        = express(); 

var port = process.env.PORT || 3000;


//Публичный и приватные ключи
var publicKey = file.readFileSync('Security_Keys/rsa-public-key.pem');
var privateKey = file.readFileSync('Security_Keys/rsa-private-key.pem')

//Соединение с БД
var config = {
    user: 'admin',
    database: 'userdb',
    password: 'admin',
    port: 5432
};

var pool = new pg.Pool(config);

//Скрываем информацию об ПО, на котором был написан сервер
app.disable('x-powered-by');

//locale russian language
moment.locale('ru');

app.use('/media', express.static(__dirname + "/media"));
app.use(express.static(__dirname + "/app"));
app.use(bodyParser.json({limit: "100mb", type:'application/json'}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, type:'application/json'}));



app.get('/getListUsers/:id', function(req, res){
	var token = req.params.id;
	var usernames = [];

	jwt.verify(token, publicKey, function(err, decoded){
		if(err){
			return console.log("Token is not verifyed!");
		};

		if(decoded.id != 106){
			return console.log("Access denied!");
		};

		pool.connect(function(err, client, done){
			if(err){
				return console.log("Error!");
			};
			client.query("SELECT username FROM users", function(err, result){
				if(err){
					return console.log("Bad request!");
				};
				done();
				for(var i = 0; i < result.rows.length; i++){
					if(result.rows[i].username != 'Admin'){
						usernames.push(result.rows[i].username);
					}
				}

				res.send(usernames);
			})
		})
	});
})

app.get('/check/:id', function(req, res){
	 var token = req.params.id;
	 var links =["/account/profile", "/account/history-determ", "/account/change-data", "/determination"];
	 var response_body = {};

	 jwt.verify(token, publicKey, function(err, decoded) {
  		if(err){
  			response_body.answer = false;
  			response_body.links = links;
  			res.send(response_body);
  			
  			return console.log("Token is not verifyed!")
  		}
  		response_body.answer = true;
  		res.send(response_body);
	 })
});


app.get('/getUserInfo/:id', function(req, res){
 	 var token = req.params.id;
 	 var data = {};

 	 jwt.verify(token, publicKey, function(err, decoded){
 	 	if(err){
 	 		return console.log("Token is not verifyed!")
 	 	}
 	 	pool.connect(function(err, client, done){
 	 		if(err){
 	 			return console.log("Error!");
 	 		}
 	 		client.query("SELECT username, photo, email, date_birth, city FROM users WHERE id = $1;", [decoded.id], function(err, result){
 	 			if(err){
 	 				return console.log("Bad request!");
 	 			}
 	 			done();
 	 			if(result.rows.length > 0){
 	 				data.username = result.rows[0].username;
 	 				data.photoURL = result.rows[0].photo;
 	 				data.Email    = result.rows[0].email;
 	 				data.date_birth = result.rows[0].date_birth;
 	 				data.city = result.rows[0].city;
 	 				res.send(data);
 	 			}
 	 		});
 	 	});
 	 });
});

app.get('/getHistoryUser/:id', function(req, res){
	var token = req.params.id;
	
	jwt.verify(token, publicKey, function(err, decoded){
		if(err){
			return console.log("Token is not verifyed!")
		}
		pool.connect(function(err, client, done){
			if(err){
				return console.log("Error!");
			}
			client.query("SELECT * FROM history_determ WHERE user_id = $1", [decoded.id], function(err, result){
				if(err){
					return console.log("Bad request!");
				}
				done();
				res.send(result.rows);
			});
		});
	});
})

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
	], function(req, res){
	var errors = validationResult(req);
	var success = {};	
	var body = req.body;
	var file_path = 'media/Standart-image.png';

	if (!errors.isEmpty()) {
    	return res.status(422).json({errors: errors.mapped()});
  	}

	pool.connect(function(err, client, done){
		if(err){
			return console.log("Error!");
		}

		client.query("SELECT username, email FROM users WHERE username = $1 OR email = $2", [body.username, body.email], function(err, result){
			if(err){
				return console.log("Bad request!");
			};

			if(result.rows.length > 0){
				errors = {};
				errors.reg = false;

				for(var i = 0; i < result.rows.length; i++){
					if(result.rows[i].username == body.username){
						errors.username = {msg: "Введённое имя пользователя уже занято"};
					}
					if(result.rows[i].email == body.email){
						errors.email = {msg: "На указанный адрес электронной почты уже зарегистрирован аккаунт"};
					}
				}
				done();
				return res.status(422).send({errors: errors});
			}

			file.mkdirSync("media/" + body.username); 
			file.mkdirSync("media/" + body.username + "/determ_history");
			file.mkdirSync("media/"+ body.username + "/avatar");

			if(body.photoURL != undefined){
				var reqExp = new RegExp("^data:" + body.type_file + ";base64,");
				var base64Data = body.photoURL.replace(reqExp, "");
				file_path = "media/" + body.username + "/avatar/avatar." + body.type_file.split("/")[1];
				file.writeFileSync(file_path, base64Data, 'base64');
			};

			client.query("INSERT INTO users (username, password, email, photo, date_birth, city) VALUES ($1, $2, $3, $4, $5, $6);", 
			[body.username, body.password, body.email, file_path, moment(body.date).format("YYYY-MM-DD"), body.city], function(err, result){
				if(err){
					console.log(err);
					return console.log("Bad request!");
				}
				done();

				success.reg = true;
				success.check_username = true;
				success.check_email = true;
				res.send(success);
			});
		});
	});
})

app.post("/autorization", [
		check('username')
			.exists().withMessage('Введите имя пользователя<br>(или адрес электронной почты)')
			.not().isEmpty().withMessage('Введите имя пользователя<br>(или адрес электронной почты)')
			.matches('(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)|(^[A-Za-z0-9А-Яа-я]+$)').withMessage('Поле содержит недопустимые символы'),
		check('password')
			.exists().withMessage('Введите пароль')
			.not().isEmpty().withMessage('Введите пароль')
	], function(req, res) {
	const errors = validationResult(req);
	var body = req.body;
	var json = {};

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	pool.connect(function(err, client, done){
		if(err){
			return console.log("Error!");
		}
		client.query("SELECT id, username, password FROM users WHERE (username=$1 OR email=$1) AND password=$2;",
			[body.username, body.password], function(err, result){
			   	if(err){
					return console.log("Bad request!");
				}
				done();
				
				if(result.rows.length > 0){
					var token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, privateKey, {algorithm: 'RS256'});
					if(result.rows[0].id == 106){
						json.root_admin = true;
					}
					json.loggedIn = true;
					json.token = token;
					
					res.send(json);
				}
				else{
					res.status(422).json({errors: {data_message_error: {msg:"Неверное имя пользователя<br>(адрес электронной почты) или пароль"}}});
				}
		})
	})
});

app.post("/saveDataHistory", function(req, res){
	var body = req.body;
	var file_path = body.path;
	var token = body.id;

	jwt.verify(token, publicKey, function(err, decoded){
		if(err){
			return console.log("Token is not verifyed!");
		}
		
		var reqExp = new RegExp("^data:" + body.type_file + ";base64,");
		var base64Data = body.photoURL.replace(reqExp, "");
		file_path = "media/" + decoded.username + "/determ_history/" + body.name_file;
		file.writeFileSync(file_path, base64Data, 'base64');

		pool.connect(function(err, client, done){
			client.query("INSERT INTO history_determ (user_id, age_determ, age_group_determ, gender_determ, photo_used_determ) VALUES ($1, $2, $3, $4, $5)", 
				[decoded.id, body.age_determ, body.age_group_determ, body.gender_determ, file_path], function(err, result){
					if(err){
						return console.log("Bad request!");
					}
					done();
				})
		});
	})
})

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
	], function(req, res){
	const errors = validationResult(req);
	var body = req.body;

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	pool.connect(function(err, client, done){
		if(err){
			return console.log("Error!")
		}
		client.query("SELECT * FROM users WHERE username=$1 AND email=$2;", 
			[body.username, body.email], function(err, result){
				if(err){
					return console.log("Bad request!");
				}
				done();
				if(result.rows.length > 0){
					var send_emails = new email(body.username, body.email, body.type_problem, body.description_problem);
					send_emails.sendMails();
				}
			})
	})
});

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
	], function(req, res){
	const errors = validationResult(req);
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	pool.connect(function(err, client, done){
		client.query("SELECT username FROM users WHERE username=$1", [body.username], function(err, result){
			if(err){
				return console.log("Bad request!");
			}

			if(result.rows.length > 0 && decoded.username != body.username){
				done();
				return res.status(422).json({errors: {username: {msg:"Введённое имя пользователя уже занято"}}})
			}

			client.query("UPDATE users SET username=$1, date_birth=$2, city=$3 WHERE id=$4", [body.username, moment(body.date_birth).format("YYYY-MM-DD"), 
			body.city, decoded.id],function(err, result){
				if(err){
					return console.log("Bad request!");
				}
				done();
			})
		})
	})
})

app.put("/account/change-email", [
		check('email')
			.exists().withMessage('Укажите адрес электронной почты')
			.not().isEmpty().withMessage('Укажите адрес электронной почты')
			.isEmail().withMessage('Неверно указан адрес электронной почты')
			.normalizeEmail()
	], function(req, res){
	const errors = validationResult(req);
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	pool.connect(function(err, client, done){
		client.query("SELECT email FROM users WHERE email=$1", [body.email], function(err, result){
			if(err){
				return console.log("Bad request!");
			}
			if(result.rows.length > 0){
				done();
				return res.status(422).json({errors: {data_message_error: {msg:"Введённый адрес электронной почты уже занят"}}})
			}

			client.query("UPDATE users SET email=$1 WHERE id=$2", [body.email, decoded.id], function(err, result){
				if(err){
					return console.log("Bad request!");
				}
				done();
			})
		})
	})
})

app.put("/account/change-password", [
		check('password')
			.exists().withMessage('Укажите пароль')
			.not().isEmpty().withMessage('Укажите пароль')
			.isAlphanumeric().withMessage('Введённый пароль содержит недопустимые символы')
			.isLength({min:5}).withMessage('Длина пароля должна быть не менее 5-ти символов')
	], function(req, res){
	const errors = validationResult(req);
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	console.log("User id: "+decoded.id);
	console.log("New password: "+body.password);
})

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
	], function(req, res){
	const errors = validationResult(req);
	var body = req.body;
	var token = body.user_id;

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	jwt.verify(token, publicKey, function(err, decoded){
		if(err){
			return console.log("Token is not verifyed!");
		}

		if(decoded.id != 106){
			return console.log("Access denied!");
		}

		pool.connect(function(err, client, done){
			if(err){
				return console.log("Error!");
			}

			client.query("UPDATE users SET password=$1 WHERE username=$2", [body.password, body.username], function(err){
				if(err){
					return console.log("Bad request!");
				}
				done();
			})
		})
	})
})

app.put("/account/profile/changeImage", function(req, res){
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);
	var files = file.readdirSync("media/" + decoded.username + "/avatar/");

	var reqExp = new RegExp("^data:" + body.type_file + ";base64,");
	var base64Data = body.image_path.replace(reqExp, "");
	var file_path = "media/" + decoded.username + "/avatar/" + body.name_file;

	if(files.length != 0){
		file.unlinkSync("media/" + decoded.username + "/avatar/"+files[0]);
	}

	file.writeFileSync(file_path, base64Data, 'base64');

	pool.connect(function(err, client, done){
		client.query("UPDATE users SET photo=$1 WHERE id=$2", [file_path, decoded.id], function(err, result){
			if(err){
				return console.log("Bad request!");
			}
			done();
			res.send(file_path);
		})
	})
})


app.use(function(req, res){
 	 res.sendFile('/app/index.html', { root: __dirname }); 
});

// Start Server
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});