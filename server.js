var express = require('express');
var morgan = require('morgan');
var path = require('path');
var crypto = require('crypto');
var session = require('express-session');
var bodyParser = require('body-parser');

var Pool = require('pg').Pool;
var config = {
    user: 'achyut92',
    database: 'achyut92',
    host: 'db.imad.hasura-app.io',
    port: '5432',
    password: process.env.DB_PASSWORD
};

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
	secret: 'randomSecrectValue',
	cookie: {maxAge: 1000*60*24*30}
}));


var pool = new Pool(config); 



function createTemplate(data){
	var title = data.title;
	var date = data.date;
	var content = data.content;

	var htmlTemplate = `<html>
	<head>
		<title>${title}</title>
		<meta name="viewport" content="width=device-width, initial-scale=1"/>
		<link href="/ui/style.css" rel="stylesheet" />
	</head>
	<body>
		<div class="container">
			<div>
		<a href="/">Home</a>
		</div>
		<hr/>
		<h3>
		${title}
		</h3>
		<div>${date.toDateString()}</div>
		<div>
			${content}
		</div>
		</div>
	</body>
</html>`;

return htmlTemplate;
}

var counter = 0;

app.get('/counter', function(req,res) {
	counter = counter + 1;
	res.send(counter.toString());
});

var names = [];
app.get('/submit-name', function(req,res){

	var name = req.query.name;
	names.push(name);
	res.send(JSON.stringify(names));
});

function hash(input,salt){
	var hashed = crypto.pbkdf2Sync(input,salt,10000,512,'sha512');
	return ["pbkdf2","10000",salt,hashed.toString('hex')].join('$');
}

app.get('/hash/:input', function(req,res){
	var hashedString = hash(req.params.input, 'this-is-some-string');
	res.send(hashedString);
});

app.post('/create-user', function(req,res){

	var username = req.body.username;
	var password = req.body.password;
	var salt = crypto.randomBytes(128).toString('hex');
	var dbString = hash(password,salt);
	pool.query('INSERT INTO "user" (username,password) VALUES ($1, $2)',[username,dbString], function(err,result){
		if(err){
           res.status(500).send(err.toString());
       }else{
           res.send('User created successfully '+username);
       }
   });
});

app.get('/education',function(req,res){
	res.sendFile(path.join(__dirname+'/ui/education.html'));
});

app.get('/project',function(req,res){
	res.sendFile(path.join(__dirname+'/ui/project.html'));
});

app.get('/contact',function(req,res){
	res.sendFile(path.join(__dirname+'/ui/contact.html'));
});

app.post('/login', function(req,res){

	var username = req.body.username;
	var password = req.body.password;

	pool.query('SELECT * FROM "user" WHERE username=$1',[username], function(err,result){
		if(err){
           res.status(500).send(err.toString());
       }else{
       		if (result.rows.length === 0) {
       			res.status(403).send('username/password is invalid.');
       		}else{
       			var dbString = result.rows[0].password;
       			var salt = dbString.split('$')[2];
       			var hashedPassword = hash(password,salt);
       			if (hashedPassword === dbString) {

       				req.session.auth = {userId: result.rows[0].id};
       				res.send('Credentials correct');

       			}else{
       				res.status(403).send('username/password is invalid.');
       			}
       		}
       }
   });
});

app.get('/check-login', function(req,res){
	if(req.session && req.session.auth && req.session.auth.userId){
    	pool.query('SELECT * FROM "user" WHERE id=$1',[req.session.auth.userId], function(err,result){
    		if(err){
               res.status(500).send(err.toString());
           }else{
               res.send(result.rows[0].username);
           }
    	});
	}else{
		res.status(400).send('You are not logged in.');
	}
});

app.get('/logout', function(req,res){
	delete req.session.auth;
	res.redirect('/');
});

app.get('/test-db',function(err,res){
   
   pool.query('SELECT * FROM test',function(err,result){
       if(err){
           res.status(500).send(err.toString());
       }else{
           res.send(JSON.stringify(result.rows));
       }
   });
});

app.get('/', function (req, res) {
		
	    res.sendFile(path.join(__dirname, 'ui', 'index.html'));
	
});

app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});

app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});

app.get('/allArticles', function(req,res){
   var articles = [];
   pool.query('SELECT heading FROM "article"',function(err,result){
       	if(err){
           res.status(500).send(err.toString());
       }else{
           if(result.rows.length === 0){
           	res.status(404).send('No Articles Found.');
           }else{
           	for(var i=0;i<result.rows.length;i++){
           	    articles.push(result.rows[i]);
           	}
           	res.send(articles);
           }
       }
   });
   
});

app.get('/articles/:articleName', function (req, res) {

	var articleName = req.params.articleName;

	pool.query('SELECT * FROM article WHERE title=$1',[articleName],function(err,result){
		if(err){
           res.status(500).send(err.toString());
       }else{
           if(result.rows.length === 0){
           	res.status(404).send('Article Not Found.');
           }else{
           	res.send(createTemplate(result.rows[0]));
           }
       }
	});

  

});





var port = 8080; // Use 8080 for local development because you might already have apache running on 80
app.listen(8080, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
