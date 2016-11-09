var feedbackBtn = document.getElementById('feedback-btn');

feedbackBtn.onclick = function() {
	
	var name = document.getElementById('name').value;
	var email = document.getElementById('email').value;
	var message = document.getElementById('message').value;
	
	var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        	if(request.readyState === XMLHttpRequest.DONE){
			if (request.status === 200) {
			    name.value='';
			    email.value='';
			    message.value='';
				alert('Thank you for your feedback.');
			}else if (request.status === 403){
				alert('Please fill all the details.');
			}else if (request.status === 500){
				alert('Something went wrong with our server.');
			}

		}
    };
    

	request.open('POST','http://achyut92.imad.hasura-app.io/submit-feedback',true);   //achyut92.imad.hasura-app.io
	request.setRequestHeader('Content-Type','application/json');
	request.send(JSON.stringify({name:name,email:email,message:message}));
};