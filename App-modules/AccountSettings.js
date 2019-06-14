const { validationResult } = require('express-validator/check');
const jwt        = require('jsonwebtoken');
const pg         = require('pg');
const file       = require('fs');
const moment     = require('moment');

//Соединение с БД
var config = {
    user: 'admin',
    database: 'userdb',
    password: 'admin',
    port: 5432
};
var publicKey = file.readFileSync('Security_Keys/rsa-public-key.pem');
var pool = new pg.Pool(config);

module.exports.getUserInfo = function(req, res){
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
}

module.exports.getHistoryUser = function(req, res){
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
}

module.exports.changeImage = function(req, res){
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
}

module.exports.updateUserInfo = function(req, res){
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
				client.query("UPDATE statistics_of_functional_use SET count_changes_user_info=count_changes_user_info+1 WHERE user_id=$1", [decoded.id], 
				function(err, result){
					if(err){
						return console.log("Bad request!");
					}
					done();
					res.send({update: true, message: "Информация об пользователе успешно изменена"});
				})
			})
		})
	})
}

module.exports.changeEmail = function(req, res){
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
				client.query("UPDATE statistics_of_functional_use SET count_changes_user_info=count_changes_user_info+1 WHERE user_id=$1", [decoded.id], 
				function(err, result){
					if(err){
						return console.log("Bad request!");
					}
					done();
					res.send({update: true, message: "адрес электронной почты успешно изменён"});
				})
			})
		})
	})
}

module.exports.changePassword = function(req, res){
	const errors = validationResult(req);
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

  	pool.connect(function(err, client, done){
  		if(err){
				return console.log("Error!");
		}
		client.query("UPDATE users SET password=$1 WHERE id=$2", [body.password, decoded.id], function(err){
			if(err){
				return console.log("Bad request!");
			}
			client.query("UPDATE statistics_of_functional_use SET count_changes_user_info=count_changes_user_info+1 WHERE user_id=$1", [decoded.id], 
			function(err, result){
				if(err){
					return console.log("Bad request!");
				}
				done();
				res.send({update: true, message: "пароль от личного аккаунта успешно изменён"});
			})
		})
  	})
}