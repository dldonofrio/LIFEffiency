var express = require("express");

var app = express();

app.use(express.static("public"));

var request = require('request');

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var mongoose = require("mongoose");
//Implements mongoose to communicate with MongoDB from within node.js

mongoose.connect("mongodb://localhost/hakron3000_db");

app.set('view engine', 'ejs');


var locationSchema = new mongoose.Schema({
	name: String,
	title: String,
	body: String,
	amount: Number,
	latitude: Number,
	longitude: Number
});

var paymentSchema = new mongoose.Schema({
    dataValue: String,
    dataDescriptor: String,
    transaction_id: String,
    date: {
		type: Date,
		default: Date.now(),
	},
});

var requestAPI; 
var postUser;
var thisLat;
var thisLng;

function wipe() {
    
    requestAPI = "";
    postUser = "";
    thisLat = "";
    thisLng = "";
};


var thisLocation = mongoose.model("new_location_collection", locationSchema);
var thisPayment = mongoose.model("new_payment_collection", paymentSchema);

app.post('/jam', function(req, res){
    console.log("1");
    postUser = {
        name:req.body.Name,
		title:req.body.Title,
		body:req.body.Body,
		amount:req.body.Amount,
		address:req.body.Address
    }
    
    res.redirect("address");
});


app.get("/address", function(req, res){
    console.log("2");
    var query = postUser.address;
    
    var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + query
     + "&key=AIzaSyAsGx132XMucPF5R85zEnF_aqnqBZfThLw";
     
    request(url, function(error, response, body){
        if(!error && response.statusCode === 200){
            requestAPI = JSON.parse(body);
            thisLat = requestAPI.results[0].geometry.location.lat;
            thisLng = requestAPI.results[0].geometry.location.lng;
            console.log(thisLat);
            console.log(thisLng);
        }
    })
    
    res.redirect('new');
});

app.get("/auth", function(req, res){
    console.log("GET request @ /auth");
    
    res.render("auth-net-test", {transaction_id:req.query._id});
});

app.post("/auth", function(req,  res){
    console.log(req.body);
    var newPayment= {
		dataValue:req.body.dataValue,
		dataDescriptor:req.body.dataDescriptor,
		transaction_id:req.body._id
	} 
	
	console.log(newPayment);
thisPayment.create(newPayment, function(err, location){
		if(err){
			console.log(err);
		} else {
			console.log("added to new_payment_collection");
		}
	});
    thisLocation.find({_id:req.body._id}).remove(function(){
    });
    res.render("confirmation", {transaction_id:req.body._id});
});


app.get('/new', function(req, res) {
    setTimeout(function() {
    console.log('Blah blah blah blah extra-blah');

    console.log("3");
    
    if(thisLat == undefined || thisLng == undefined) {
        console.log("Could not parse that addresss");
        res.redirect("/");
        wipe();
    } else {
	var newLocation = {
		name:postUser.name,
		title:postUser.title,
		body:postUser.body,
		amount:postUser.amount,
		latitude:thisLat,
		longitude:thisLng,
	} 
	
	console.log(newLocation);
thisLocation.create(newLocation, function(err, location){
		if(err){
			console.log(err);
			wipe();
		} else {
			console.log("added to new_location_collection");
			wipe();
		}

		res.redirect("/");
	});
}
    }, 1500);
    });

app.get("/", function(req, res){
    console.log("4");
        thisLocation.find({}, function(err, theLocation){
        if(err){
            console.log("Database error");
            console.log(err);
            wipe();
        } else {
            res.render("test", {locations:theLocation})
            //Serves up test.ejs and collects user input
        }
        });
});


app.get("*", function(req, res){
    console.log("5");
    res.redirect("/");
    //Catches any unknown gibberish and re-directs back to "/"
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server is listening...");
});
