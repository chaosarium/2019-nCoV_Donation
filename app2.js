//===================
//====NodeJS Head====
//===================
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const crypto = require("crypto");
const request = require('request');
const fs = require("fs");
const colours = require('colors');
const CronJob = require('cron').CronJob;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
//caching method
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
});

// app.set('etag', false)
// app.disable('view cache');


//=================
//====Variables====
//=================
const port = 38482
const url = "mongodb://localhost:27017"
const dbName = "nCoV"
const collectionName = "donationRecords"
var countNO = 2
var openStatus = true


const job = new CronJob('00 59 23 01 FEB *', function() {
  console.log('Closing donation');
  openStatus = false;
});
job.start();

//=================
//====Functions====
//=================
function getDateTime() {
  var date = new Date();
  
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  var sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;
  var milisec = date.getMilliseconds();
  milisec = ((milisec < 100) ? ((milisec < 10) ? "00" : "0") : "") + milisec;
  
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day = date.getDate();
  day = (day < 10 ? "0" : "") + day;
  
  var timeArray = {year: year, month: month, day: day, hour: hour, min: min, sec: sec, milisec: milisec}
  return timeArray;
}

//insert entry function
function dbInsert(serial, fullName, emailAddress, grade, donationAmount, paymentMethod, message, anonymousStatus) {
  //manipulate data
  var displayName = ""
  var displayEmail = ""
  var displayGrade = ""
  var displayPaymentMethod = ""
  if (anonymousStatus == "on") {
    displayName = "Anonymous"
    displayEmail = "-"
    displayGrade = "-"
    displayPaymentMethod = "-"
  } else {
    displayName = fullName
    displayEmail = emailAddress
    displayGrade = grade
    displayPaymentMethod = paymentMethod
  }
  
  //connect to mongo client
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    //create object
    var myobj = {serial: serial, timeStamp: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year + " " + getDateTime().hour + ":" + getDateTime().min + ":" + getDateTime().sec, fullName: fullName, displayName: displayName, emailAddress: displayEmail, displayEmail, grade: grade, displayGrade: displayGrade, donationAmount: donationAmount, paymentMethod: paymentMethod, displayPaymentMethod: displayPaymentMethod, message: message, anonymousStatus: anonymousStatus};

    //insert document
		dbo.collection(collectionName).insertOne(myobj, function(err, res) {
      if (err) console.log(err);
      console.log("Entry added");
      countNO++
      db.close();
		});
  });
  return
};

//Remove entry function
// function dbRemove(studentID) {
//   MongoClient.connect(url, function(err, db) {
//     if (err) console.log(err);
//     var dbo = db.db(dbName);
//
//     //remove document
// 		dbo.collection(collectionName).deleteOne({StudentID: studentID}, function(err, obj) {
// 			if (err) console.log(err);
// 			console.log("Entry removed");
// 			db.close();
// 		});
// 	});
// };

//Remove all function
// function dbRemoveAll() {
//   MongoClient.connect(url, function(err, db) {
//     if (err) console.log(err);
//     var dbo = db.db(dbName);
//
//     //remove document
// 		dbo.collection(collectionName).remove({}, function(err, result) {
// 			if (err) console.log(err);
// 			console.log("Removed all");
// 			db.close();
// 		});
// 	});
// };

//========================
//====Request Handling====
//========================

//Admin Page
app.get("/hjiwuehrionvj873yu4ihnq2j387hb983bchq8r7b", function(req, res){
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection(collectionName).find({}).toArray(function(err, result) {
			if (err) throw err
      db.close()
      res.render('admin', {dataList: result})
		})
  })
});

//Home Page
app.get("/", function(req, res){
  
  res.render("down")
  
});

//Donate POST
app.post("/donate-req", function(req, res){
 
  res.render("down")
  
});

//Data Page
app.get("/data", function(req, res){
  res.render("down")
});

//Cancel Page
// app.get("/cancel", function(req, res){
//   res.render('cancel');
// });
//
// //Erase Page
// app.get("/erase", function(req, res){
//   res.render('erase');
// });
//
// //Cancel POST
// app.post("/cancel", function(req, res){
//   console.log("cancel post request recieved")
//   //get post info
//   var studentID = req.body.studentID
//   var operationPassword = req.body.operationPassword
//   console.log("request info: " + "|" + studentID + "|" + operationPassword + "|");
//
//   //check password
//   if (crypto.createHmac('sha256', operationPassword).digest('hex') == operationPasswordHash) {
//     //Check ID availability
//       MongoClient.connect(url, function(err, db) {
//         if (err) throw err
//         var dbo = db.db(dbName)
//         dbo.collection(collectionName).find({StudentID: studentID}).toArray(function(err, result) {
//           if (err) throw err
//           if (result.length > 0) {
//             dbRemove(studentID);
//             res.render("info", {location: "data", infoTitle: "Operation Successful", infoMessage: "One occurance of " + studentID + " has been removed from the list"})
//           }
//           else {
//             res.render("info", {location: "cancel", infoTitle: "ERROR", infoMessage: "The requested student ID is invalid, pleas try again."})
//           }
//         });
//       });
//   }
//   else {
//     res.render("info", {location: "cancel", infoTitle: "ERROR", infoMessage: "Wrong operation password, please try again"})  }
// });
//
// //Erase POST
// app.post("/erase", function(req, res){
//   console.log("erase post request recieved")
//   //get post info
//   var operationPassword = req.body.operationPassword
//   var varificationQuestion = req.body.varificationQuestion
//   console.log("request info: " + "|" + operationPassword + "|" + varificationQuestion + "|");
//
//   //check password
//   if (crypto.createHmac('sha256', operationPassword).digest('hex') == operationPasswordHash && varificationQuestion == 17) {
//     dbRemoveAll();
//     res.render("info", {location: "data", infoTitle: "Operation Successful", infoMessage: "All information has been erased."})
//   }
//   else {
//     res.render("info", {location: "erase", infoTitle: "ERROR", infoMessage: "Wrong operation password or varification question answer, please try again."})
//   }
// });

//Listen
app.listen(port, function(){
  console.log("app started on port " + port);
});


//=================
//====Test Zone====
//=================
// console.log(crypto.createHmac('sha256', "string").digest('hex'));
// dbInsert("07:00-08:00", "Leon", "Lu", "10", "2220067");
// dbRemove("2220067");
// console.log(dbCheck("124543"))
// dbRemoveAll()

// dbInsert("Leon Lu", "2220056@ncpachina.org", 10, 3.14, "W", "Good Luck", false)

// dbInsert("Leon Luu", "2220056@ncpachina.org", 10, 3.14, "W", "Good Luck", true)