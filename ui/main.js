console.log('Loaded!');


var submit = document.getElementById('submit_btn');
submit.onclick = function(){


	request.onreadystatechange = function () {

		if(request.readyState === XMLHttpRequest.DONE){
			if (request.status === 200) {
				console.log('user logged in');
				alert('Logged in successfully');
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
