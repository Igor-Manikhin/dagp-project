const { validationResult } = require('express-validator/check');
const moment     = require('moment');
const jwt        = require('jsonwebtoken');
const pg         = require('pg');
const file       = require('fs');

//Соединение с БД
var config = {
    user: 'admin',
    database: 'userdb',
    password: 'admin',
    port: 5432
};

var publicKey = file.readFileSync('Security_Keys/rsa-public-key.pem');
var pool = new pg.Pool(config);

module.exports.changeUserPassword = function(req, res){
	const errors = validationResult(req);
	var body = req.body;
	var token = body.user_id;

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	jwt.verify(token, publicKey, function(err, decoded){
		if(err || decoded.id != 106){
			return console.log("Token is not verifyed!");
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
}

module.exports.getListUsers = function(req, res){
	var token = req.params.id;
	var usernames = [];

	jwt.verify(token, publicKey, function(err, decoded){
		if(err || decoded.id != 106){
			return console.log("Token is not verifyed!");
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
}

module.exports.getHistoryVisitsUser = function(req, res){
	const errors = validationResult(req);
	var token = req.query.id;
	var user  = req.query.username; 
	var dates = [];
	var count = [];

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	jwt.verify(token, publicKey, function(err, decoded){
		if(err || decoded.id != 106){
			return console.log("Token is not verifyed!");
		}
		
		pool.connect(function(err, client, done){
			if(err){
				return console.log("Error!");
			};

			client.query("SELECT id FROM users WHERE username=$1", [user], function(err, result){
				if(err){
					return console.log("Bad request!");
				};

				if(result.rows.length > 0){
					client.query("SELECT date_of_visit FROM history_visits WHERE user_id=$1", [result.rows[0].id], function(err, result){
						if(err){
							return console.log("Bad request!");
						}
						done();
						for(var i = 0; i < result.rows.length; i++){
							dates.push(moment(result.rows[i].date_of_visit).format('YYYY.MM.DD'));
						}
						
						var result = dates.reduce(function(acc, el){
							acc[el] = (acc[el] || 0) + 1;
							return acc;
						}, {})

						dates.splice(0, dates.length);

						for(key in result){
							dates.push(key);
							count.push(result[key]);
						}
						res.send({labels: dates, data: count});
					})
				}
			});
		});
	})
}

module.exports.getStatisticsOfUseFunctional = function(req, res){
	const errors = validationResult(req);
	var token = req.query.id;
	var username = req.query.username;
	var data = [];
	var labels = ["Использование функционала распознавания", "Изменение данных профиля", "Обращение в службу технической поддержки"];

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}
	
	jwt.verify(token, publicKey, function(err, decoded){
		if(err || decoded.id != 106){
			return console.log("Token is not verifyed!");
		}

		pool.connect(function(err, client, done){
			if(err){
				return console.log("Error!");
			};

			client.query("SELECT id FROM users WHERE username=$1;",[username], function(err, result){
				if(err){
					return console.log("Bad request!");
				};

				if(result.rows.length > 0){
					client.query("SELECT count_use_function_determ, count_changes_user_info, count_tech_support_calls FROM statistics_of_functional_use WHERE user_id=$1",
					[result.rows[0].id], function(err, result){
						if(err){
							return console.log("Bad request!");
						};
						done();

						data.push(result.rows[0].count_use_function_determ);
						data.push(result.rows[0].count_changes_user_info);
						data.push(result.rows[0].count_tech_support_calls);

						res.send({labels: labels, data: data});
					})
				}
			})
		})
	})
}