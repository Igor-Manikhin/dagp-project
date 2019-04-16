// Required Modules
var express    = require('express');
var jwt        = require('jsonwebtoken');
var pg         = require('pg');
var file       = require('fs');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
var hbs        = require('nodemailer-handlebars'); 
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

app.use('/media', express.static(__dirname + "/media"));
app.use(express.static(__dirname + "/app"));
app.use(bodyParser.json({limit: "100mb", type:'application/json'}));
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, type:'application/json'}));


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
 	 		client.query("SELECT * FROM users WHERE id = $1;", [decoded.id], function(err, result){
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
 	 		})
 	 	})
 	 })
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

app.post("/registration", function(req, res){	
	var body = req.body;
	var reg = false;
	var file_path = 'media/Standart-image.png';
	var keyNames = Object.keys(body);


	pool.connect(function(err, client, done){
		if(err){
			return console.log("Error!");
		}

		client.query("SELECT * FROM users WHERE username = $1 OR email = $2", [body.username, body.email], function(err, result){
			if(err){
				return console.log("Bad request!");
			};

			if(result.rows.length > 0){
				done();
				for(var i = 0; i < result.rows.length; i++){
					if(result.rows[i].username == body.username){
						return console.log(body.username+" уже занято!");
					}
					if(result.rows[i].email == body.email){
						return console.log(body.email+" уже занят!");
					}
				}
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
			[body.username, body.password, body.email, file_path, body.date, body.city], function(err, result){
				if(err){
					console.log(err);
					return console.log("Bad request!");
				}
				done();

				reg = true;
				res.send(reg);
			});
		});
	});
})

app.post("/autorization", function(req, res) {
	var body = req.body;
	var json; 

	pool.connect(function(err, client, done){
		if(err){
			return console.log("Error!");
		}
		client.query("SELECT * FROM users WHERE (username=$1 OR email=$1) AND password=$2;",
			[body.username, body.password], function(err, result){
			   	if(err){
					return console.log("Bad request!");
				}
				done();
				if(result.rows.length > 0){
					var token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, privateKey, {algorithm: 'RS256'});
					json = {
						loggedIn: true,
						token: token,
					}
					res.send(json);
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

app.post("/support", function(req, res){
	var body = req.body;

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

					var mailToUser = {
  							from: 'support@dagp.ru',
  							to: body.email,
  							subject: 'Фиксация проблемы веб-сервиса' + " <"+body.typeProblem+">",
  							template: 'index',
  							context: {
  								username: body.username
  							}
					};

					var mailToAdmin = {
						from: 'support@dagp.ru',
						to: 'i.manihin@dagp.ru',
						subject: 'Фиксация проблемы веб-сервиса' + " <"+body.typeProblem+">",
						html: 'Пользователь '+body.username+' обнаружил проблему в работоспособности веб-сервиса, связанную с '+
						'\"'+body.typeProblem+'\".'+'<br><br>'+'Ниже привидено описание проблемы:'+'<br>'+body.problem
					}

					transporter.sendMail(mailToUser);
					transporter.sendMail(mailToAdmin);
				}
			})
	})
});

app.put("/account/updateUserInfo", function(req, res){
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);

	pool.connect(function(err, client, done){
		client.query("UPDATE users SET username=$1, date_birth=$2, city=$3 WHERE id=$4", [body.username, body.date_birth, body.city, decoded.id],
		function(err, result){
			if(err){
				return console.log("Bad request!");
			}
			done();
		})
	})
})

app.put("/account/change-email", function(req, res){
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);

	pool.connect(function(err, client, done){
		client.query("UPDATE users SET email=$1 WHERE id=$2", [body.email, decoded.id], function(err, result){
			if(err){
				return console.log("Bad request!");
			}
			done();
		})
	})
})

app.put("/account/change-password", function(req, res){
	var body = req.body;
	var token = body.user_id;
	var decoded = jwt.verify(token, publicKey);
	console.log("User id: "+decoded.id);
	console.log("New password: "+body.password);
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