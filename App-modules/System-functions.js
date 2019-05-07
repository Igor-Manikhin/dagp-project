const { validationResult } = require('express-validator/check');
const pg         = require('pg');
const jwt        = require('jsonwebtoken');
const file       = require('fs');
const email      = require('./email-send');

//Соединение с БД
var config = {
    user: 'admin',
    database: 'userdb',
    password: 'admin',
    port: 5432
};

var publicKey = file.readFileSync('Security_Keys/rsa-public-key.pem');
var pool = new pg.Pool(config);


module.exports.check = function(req, res){
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
}

module.exports.saveDataHistory = function(req, res){
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
					client.query("UPDATE statistics_of_functional_use SET count_use_function_determ=count_use_function_determ+1 WHERE user_id=$1", [decoded.id], 
					function(err, result){
						if(err){
							return console.log("Bad request!");
						}
						done();
					})
			})
		});
	})
}

module.exports.support = function(req, res){
	const errors = validationResult(req);
	var body = req.body;

	if(!errors.isEmpty()){
    	return res.status(422).json({errors: errors.mapped()});
  	}

	pool.connect(function(err, client, done){
		if(err){
			return console.log("Error!")
		}
		client.query("SELECT id FROM users WHERE username=$1 AND email=$2;", 
			[body.username, body.email], function(err, result){
				if(err){
					return console.log("Bad request!");
				}
				if(result.rows.length > 0){
					var send_emails = new email(body.email);
					send_emails.send_Mails_To_Support_And_User(body.username, body.type_problem, body.description_problem);

					client.query("UPDATE statistics_of_functional_use SET count_tech_support_calls=count_tech_support_calls+1 WHERE user_id=$1", [result.rows[0].id], 
					function(err, result){
						if(err){
							return console.log("Bad request!");
						}
						done();
						res.send({answer: true});
					})
				}
			})
	})
}