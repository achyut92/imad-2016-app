
console.log('post article js');
var submit_article = document.getElementById('submit-article');

submit_article.onclick = function(){
    var request = new XMLHttpRequest();

    request.onreadystatechange = function(){
            if(request.readyState === XMLHttpRequest.DONE){
            if (request.status === 200) {
                alert('Thank you for the post.');
               
            }else if (request.status === 403){
                alert('Please write a post to save.');
            }else if (request.status === 500){
                alert('Something went wrong with our server.');
            }

        }
    };
    
    var heading = document.getElementById('heading').value;
    var content = document.getElementById('content').value;

    request.open('POST','http://achyut92.imad.hasura-app.io/post-article',true);   //achyut92.imad.hasura-app.io
    request.setRequestHeader('Content-Type','application/json');
    request.send(JSON.stringify({heading:heading,content:content}));  
};