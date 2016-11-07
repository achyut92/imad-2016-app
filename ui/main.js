console.log('Loaded!');


var submit = document.getElementById('submit-btn');
var register = document.getElementById('register-btn');
var bool = true;

submit.onclick = function(){
    
    var request = new XMLHttpRequest();

	request.onreadystatechange = function () {

		if(request.readyState === XMLHttpRequest.DONE){
			if (request.status === 200) {
				console.log('user logged in');
			
				alert('Logged in successfully');
				
				location.reload();
			}else if (request.status === 403){
				alert('Username/Password is Invalid!');
			}else if (request.status === 500){
				alert('Something went wrong with our server.');
			}

		}

	};

	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;

	request.open('POST','http://achyut92.imad.hasura-app.io/login',true);   //achyut92.imad.hasura-app.io
	request.setRequestHeader('Content-Type','application/json');
	request.send(JSON.stringify({username:username,password:password}));
};

register.onclick = function(){
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        	if(request.readyState === XMLHttpRequest.DONE){
			if (request.status === 200) {
				console.log('User registered');
				alert('Registered successfully');
			}else if (request.status === 403){
				alert('Registeration unsuccessfully.');
			}else if (request.status === 500){
				alert('Something went wrong with our server.');
			}

		}
    };
    var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;

	request.open('POST','http://achyut92.imad.hasura-app.io/create-user',true);   //achyut92.imad.hasura-app.io
	request.setRequestHeader('Content-Type','application/json');
	request.send(JSON.stringify({username:username,password:password}));
};

function checkLogin(){
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                console.log(this.responseText);
                loadLoggedInUser(this.responseText);
               
            }else{
            
            }
        }
    };
    request.open('GET', '/check-login', true);
    request.send(null);
}
var articleTitles = ``;
function getArticleTitles(){
    var request = new XMLHttpRequest();
     request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            if (request.status === 200) {
                var articles = JSON.parse(this.responseText);
                for (var i = 0; i < articles.length; i++) { 
                        articleTitles+=`<li><a href="/artilces/${articles[i].title}">${articles[i].heading}</a></li>`;
                    }
            }
        }
     };
     request.open('GET', '/allArticles', true);
     request.send(null);
}


function loadLoggedInUser(username){
    var logoutArea = document.getElementById('login_area');
    var loginForm = document.getElementById('login-form');
    //loginForm.style.display = 'none';
   
    loginForm.innerHTML = `<a href="/allArticles">Load Articles</a>`;
    logoutArea.innerHTML = `
        <h6> Hi <i>${username}</i></h6>
        <a href="/logout">Logout</a>
    `;
}
checkLogin();
if(bool === true){
    getArticleTitles();
    bool=false;
}


