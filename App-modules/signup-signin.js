const { validationResult } = require('express-validator/check');
var jwt        = require('jsonwebtoken');
var file       = require('fs');
var pg         = require('pg');
var moment     = require('moment');

//Соединение с БД
var config = {
    user: 'admin',
    database: 'userdb',
    password: 'admin',
    port: 5432
};

var privateKey = file.readFileSync('Security_Keys/rsa-private-key.pem')
var pool = new pg.Pool(config);

module.exports.signup = function(req, res){
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

			client.query("INSERT INTO users (username, password, email, photo, date_birth, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;", 
			[body.username, body.password, body.email, file_path, moment(body.date).format(), body.city], function(err, result){
				if(err){
					return console.log("Bad request!");
				}
				client.query("INSERT INTO statistics_of_functional_use (user_id ,count_use_function_determ, count_changes_user_info, count_tech_support_calls) VALUES ($1, 0, 0, 0);", 
				[result.rows[0].id], function(err, result){
					if(err){
						return console.log("Bad request!");
					}
					done();
					success.reg = true;
					success.check_username = true;
					success.check_email = true;
					res.send(success);
				})
			});
		});
	});
}

module.exports.signin = function(req, res) {
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
				
				if(result.rows.length > 0){
					var token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, privateKey, {algorithm: 'RS256'});
					if(result.rows[0].id == 106){
						json.root_admin = true;
					}
					json.loggedIn = true;
					json.token = token;

					client.query("INSERT INTO history_visits (user_id, date_of_visit) VALUES ($1, $2)", [result.rows[0].id,
					moment().format()], function(err, result){
						if(err){
							return console.log("Bad request!");
						}
						done();
						res.send(json);
					})
				}
				else{
					res.status(422).json({errors: {data_message_error: {msg:"Неверное имя пользователя<br>(адрес электронной почты) или пароль"}}});
				}
		})
	})
}

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