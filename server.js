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
	var heading = data.heading;

	var htmlTemplate = `<html>
	<head>
		<title>${heading}</title>
		<meta name="viewport" content="width=device-width, initial-scale=1"/>
		<link href="/ui/style.css" rel="stylesheet" />
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">
	</head>
	<body>
	<a class="btn btn-info btn-sm home" href="/"><span class="glyphicon glyphicon-home"></span> Home</a>
		<div class="container">
			<div>
		
		</div>
		<hr/>
		<h3>
		${heading}
		</h3>
		<div>${date.toDateString()}</div>
		<br>
		<div>
			${content}
		</div>
    <hr>
    <h4>Comments</h4>
    
    <div id="comments">
      <center>Loading Comments..</center>
    </div>
    <div id="comment_form" ></div>
	
    </div>
     <script type="text/javascript" src="/ui/article.js"></script>
	</body>
</html>`;

return htmlTemplate;
}




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
	if(username === '' || password === ''){
	    res.status(403).send();
	    return;
	}
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

app.post('/submit-feedback',function(req,res){
  var name = req.body.name;
  var email = req.body.email;
  var message = req.body.message;

  if(name === '' || email === '' || message === ''){
      res.status(403).send();
      return;
    }

    pool.query('INSERT INTO "contact" (name,email,message) VALUES ($1, $2, $3)',[name,email,message], function(err,result){
    if(err){
           res.status(500).send(err.toString());
       }else{
           res.send('Feedback stored.');
       }
   });

});

app.post('/post-article', function(req,res){
  var heading = req.body.heading;
  var content = req.body.content;

  if(heading === '' || content === ''){
      res.status(403).send();
      return;
    }

  var title = content.replace(/\s+/g, '-').toLowerCase();
  var date = new Date();

  pool.query('INSERT INTO "article" (title,heading,date,content) VALUES ($1, $2, $3,$4)',[title,heading,date,content], function(err,result){
    if(err){
           res.status(500).send(err.toString());
       }else{
           res.send('Post stored.');
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

app.get('/post-article',function(req,res){
	res.sendFile(path.join(__dirname+'/ui/post-article.html'));
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



app.get('/ui/:fileName', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', req.params.fileName));
});

app.get('/get-articles', function (req, res) {
   // make a select request
   // return a response with the results
   pool.query('SELECT * FROM article ORDER BY date DESC', function (err, result) {
      if (err) {
          res.status(500).send(err.toString());
      } else {
          res.send(JSON.stringify(result.rows));
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

app.get('/get-comments/:articleName', function(req,res){
  pool.query('SELECT comment.*,"user".username FROM article,"user",comment WHERE article.title=$1 AND article.id=comment.article_id AND comment.user_id="user".id ORDER BY comment.timestamp DESC',[req.params.articleName],function(err,result){
    if (err) {
          res.status(500).send(err.toString());
      } else {
          res.send(JSON.stringify(result.rows));
      }
  });
});

app.post('/submit-comment/:articleName', function(req,res){
    
    var comment = req.body.comment;
    
    if(comment === ''){
        res.status(403).send();
        return;
    }

  if(req.session && req.session.auth && req.session.auth.userId){
    pool.query('SELECT * FROM "article" WHERE title=$1',[req.params.articleName],function(err,result){
      if(err){
        res.status(500).send(err.toString());
      }else{
        if(result.rows.length === 0){
          res.send('Article not Found.');
        }else{
          var articleId = result.rows[0].id;
          pool.query('INSERT INTO "comment" (comment,user_id,article_id) VALUES ($1,$2,$3)',[comment,req.session.auth.userId,articleId],function(err,result){
            if(err){
              res.status(500).send(err.toString());
            }else{
              res.status(200).send('Comment Saved.');
            }
          });
        }
      }
    });
  }else{
    res.status(403).send('Only logged in user can comment');
  }

});




var port = 8080; // Use 8080 for local development because you might already have apache running on 80
app.listen(8080, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
