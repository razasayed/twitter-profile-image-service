var express = require('express');
var app = express();
var redis = require('redis'),
    client = redis.createClient(); 

var twitter = require('ntwitter');
var twit = new twitter({
  consumer_key: process.env.CONSUMER_KEY ,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

app.get('/get_profile_image_url/:handle', function(req, res){

     client.on("error",function(err) {
	res.json({status:"0",message: err});
     });

     //Check if image url can be fetched from redis
     client.exists(req.params.handle,function(err,response) {
	if(response) {
	   client.get(req.params.handle,function(err,response){
		res.json({status:"1", profile_image_url: response});
           });
        }
        else {
            //Use Twitter API to fetch the url and store the url in redis
            twit.showUser(req.params.handle,function(err,data) {
		if(err == null){
                    var url = eval(data[0]).profile_image_url;
		    client.set(req.params.handle,url);
                    client.expire(req.params.handle,604800); //Expire the key in 1 week.
                    res.json({status:"1", profile_image_url: url});
                }
		else{
			res.json({status:"0", message:"User not found"});
                }	
            });		
        }
     });    

});


app.listen(3001);
console.log('Listening on port 3001');
