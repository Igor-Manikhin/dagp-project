//используемые модули и библиотеки
const { validationResult } = require('express-validator/check');
var jwt        = require('jsonwebtoken');
var file       = require('fs');
var pg         = require('pg');
var moment     = require('moment');

//Соединение с БД
var config = {
    user: 'admin', //Имя учётной записи в СУБД PostgreSQL
    database: 'userdb', //Имя базы данных
    password: 'admin', //Пароль от учётной записи в СУБД PostgreSQL
    port: 5432 //Порт соединения с базой данных
};

var privateKey = file.readFileSync('Security_Keys/rsa-private-key.pem') //Публичный ключ, используемый для расшифровки и верификации входного токена, содержащего в себе 
																		//информацию по текущуму пользователю 
var pool = new pg.Pool(config);

//Блок регистрации нового аккаунта на веб-сервие
module.exports.signup = function(req, res){
	var errors = validationResult(req); //Ошибки, полученные при проверки отправленных данных, указанных при регистрации нового аккаунта на веб-сервисе
	var success = {}; //Тело ответа сервера, содеожащий информацию об успешной регистрации нового аккаунта на веб-сервисе	
	var body = req.body; //Получение данных, указанных при регистрации нового аккаунта, из тела запроса 
	var file_path = 'media/Standart-image.png'; //Путь к стандартной фотографии, устанавливаемой по-умолчанию в профиле пользователя веб-сервиса 

	//Если данные, указанные при регистрации нового личного аккаунта пользователя веб-сервиса, не прошли валидацию
	if (!errors.isEmpty()) {
		//Отправить в качестве ответа ошибки, найденные в указанных данных при регистрации нового аккаунта веб-сервиса 
    	return res.status(422).json({errors: errors.mapped()});
  	}
  	//Если ошибок не было найденно, то устанавливаем соединение с базой данных веб-сервиса
	pool.connect(function(err, client, done){
		//Если не удалось подключиться к базе данных веб-сервиса
		if(err){
			//Вернуть сообщение об ошибки подключения к базе данных веб-сервиса
			return console.log("Error!");
		}
		//При успешном соединении с базой данных веб-сервиса проверяем
		//Свободно ли имя пользователя или адрес электронной почты, указанные при регистрации нового аккаунта 
		client.query("SELECT username, email FROM users WHERE username = $1 OR email = $2", [body.username, body.email], function(err, result){

			//Если запрос к базе данных был указан некорректно
			if(err){
				//Вернуть сообщение о некорректном запросе к базе данных веб-сервиса
				return console.log("Bad request!");
			};

			//Если в базе данных были найдены пользователи с указанным именем пользователя или адресом электронной почты
			if(result.rows.length > 0){
				errors = {}; //объект, содержащий сведения об ошибках, касаемых совпанения введенных имени пользователя и адреса электронной почты
				             //с именами и адресами электронных почт зарегистрированных пользователей веб-сервиса

				errors.reg = false; //Ответ сервера о том, что регистрация нового аккаунта не может быть выполнена

				for(var i = 0; i < result.rows.length; i++){
					//Если имя одного из зарегистрированных пользователей совпадает с именем пользователя, указанным при регистрации нового аккаунта
					if(result.rows[i].username == body.username){
						errors.username = {msg: "Введённое имя пользователя уже занято"};//Добавить в объект "errors" сообщение о том, что введённое имя пользователя 
						                                                                 //уже занято
					}
					//Если адрес электронной почты одного из зарегистрированных пользователей совпадает с адресом электронной почты, указанной при регистрации нового аккаунта
					if(result.rows[i].email == body.email){
						errors.email = {msg: "На указанный адрес электронной почты уже зарегистрирован аккаунт"};//Добавить в объект "errors" сообщение о том, что введённый
						                                                                                         //адрес электронной почты уже занят
					}
				}
				done(); //Завершить соединение с базой данных веб-сервиса
				return res.status(422).send({errors: errors}); //вернуть объект "errors" в качестве ответа сервера за отправленный POST-запрос со статусом "422"
			}
			//Если введённые имя пользователя и адрес электронной почты не совпадают с теми, которые уже заняты другими зарегистрированными пользователяит
			file.mkdirSync("media/" + body.username); //Создать папку с введённым именем пользователя 

			file.mkdirSync("media/" + body.username + "/determ_history"); //Создать папку в папке, выделенной под зарегистрированного пользователя, папку "determ_history"
																		 //Для хранения изображений лиц людей, использованных для определения возраста, возрастной группы 
																		 //и пола человека

			file.mkdirSync("media/"+ body.username + "/avatar"); //Создать папку в папке, выделенной под зарегистрированного пользователя, папку "avatar", в которой
																//будет храниться фотография, загруженная пользователем при регистрации нового аккаунта

			//Если полученный путь изображения не имеет тип "undefined"
			if(body.photoURL != undefined){
				var reqExp = new RegExp("^data:" + body.type_file + ";base64,"); //собрать регулярное выражение
				var base64Data = body.photoURL.replace(reqExp, ""); //разбить регулярное выражение по симоволу "" для получения фотографии, зашифрованной в формате Base64

				file_path = "media/" + body.username + "/avatar/avatar." + body.type_file.split("/")[1]; //собрать путь к фотографии, расположенной в файловой системе веб-сервиса
																										 //для занесения в дальнейшем в базу данных веб-сервиса

				file.writeFileSync(file_path, base64Data, 'base64'); //Записать фотографию, указанную пользователем при регистрации нового аккаунта, по указанному пути
			};
			//Сделать запрос на добавление данных в таблицу "users", указанных при регистрации нового аккаунта пользователя веб-сервиса
			client.query("INSERT INTO users (username, password, email, photo, date_birth, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;", 
			[body.username, body.password, body.email, file_path, moment(body.date).format(), body.city], function(err, result){

				//Если запрос к базе данных был указан некорректно
				if(err){
					//Вернуть сообщение о некорректном запросе к базе данных веб-сервиса
					return console.log("Bad request!");
				}
				//Сделать запрос на добавление записи в таблицу "statistics_of_functional_use", отвечающую за хранение данных для статистики посещений и использования основного функционала веб-сервиса
				client.query("INSERT INTO statistics_of_functional_use (user_id ,count_use_function_determ, count_changes_user_info, count_tech_support_calls) VALUES ($1, 0, 0, 0);", 
				[result.rows[0].id], function(err, result){

					//Если запрос к базе данных был указан некорректно
					if(err){
						//Вернуть сообщение о некорректном запросе к базе данных веб-сервиса
						return console.log("Bad request!");
					}
					done(); //Завершить соединение с базой данных веб-сервиса
					success.reg = true; //Добавление флага об успешной регистрации нового аккаунта веб-сервиса
					success.check_username = true; //Добавление флага о успешно пройденной проверки имени пользователя, указанного при регистрации нового аккаунта на совпание
												   //С другими именами зарегистрированных пользователей веб-сервиса 
					success.check_email = true;   //Добавление флага о успешно пройденной проверки адреса электронной почты, указанного при регистрации нового аккаунта на совпание
												  //С другими адресами электронных почт зарегистрированных пользователей веб-сервиса 
					res.send(success); //Отправить сформированный ответ об успешной регистрации нового аккаунта пользователя
				})
			});
		});
	});
}

//Блок, отвечающий за авторизацию в личном аккаунте на веб-сервисе
module.exports.signin = function(req, res) {
	const errors = validationResult(req); //Ошибки, полученные при проверки отправленных данных, указанных при авторизации в личном аккаунте на веб-сервисе
	var body = req.body; //Получение данных, указанных при авторизации в личном аккаунте нового аккаунта, из тела запроса
	var success = {};

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
				
				if(result.rows.length > 0){
					var token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, privateKey, {algorithm: 'RS256'});
					if(result.rows[0].id == 106){
						success.root_admin = true;
					}
					success.loggedIn = true;
					success.token = token;

					client.query("INSERT INTO history_visits (user_id, date_of_visit) VALUES ($1, $2)", [result.rows[0].id,
					moment().format()], function(err, result){
						if(err){
							return console.log("Bad request!");
						}
						done();
						res.send(success);
					})
				}
				else{
					res.status(422).json({errors: {data_message_error: {msg:"Неверное имя пользователя<br>(адрес электронной почты) или пароль"}}});
				}
		})
	})
}

//Блок, отвечающий за восстановление пароля от личного аккаунта пользователя в случае его утери
module.exports.recoveryPassword = function(req, res){
	const errors = validationResult(req);
	var body = req.body;

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

  	pool.connect(function(err, client, done){
  		if(err){
			return console.log("Error!");
		}

		client.query("SELECT id, username, email FROM users WHERE email=$1;", [body.email], function(err, result){
			if(err){
				return console.log("Bad request!");
			}

			if(result.rows.length > 0){
				client.query("UPDATE users SET password=$1 WHERE id=$2", [body.password, result.rows[0].id], function(err, result){
					if(err){
						return console.log("Bad request!");
					}
					done();
					res.send({answer: true});
				})
			}
			else{
				done();
				res.status(422).send(false);
			}
		})
  	})
}