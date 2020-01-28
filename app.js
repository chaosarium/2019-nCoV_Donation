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
const port = 2019
const url = "mongodb://localhost:27017"
const dbName = "nCoV"
const collectionName = "donationRecords"

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
function dbInsert(fullName, emailAddress, grade, donationAmount, paymentMethod, message, anonymousStatus) {
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
    var myobj = {fullName: fullName, displayName: displayName, emailAddress: displayEmail, displayEmail, grade: grade, displayGrade: displayGrade, donationAmount: donationAmount, paymentMethod: paymentMethod, displayPaymentMethod: displayPaymentMethod, message: message, anonymousStatus: anonymousStatus};

    //insert document
		dbo.collection(collectionName).insertOne(myobj, function(err, res) {
      if (err) console.log(err);
      console.log("Entry added");
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
//Home Page
app.get("/", function(req, res){
  var moneyCount = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection(collectionName).find({}).toArray(function(err, result) {
			if (err) throw err
			for (var i = 0; i < result.length; i++) {
			  moneyCount = moneyCount + result[i].donationAmount
      }
      console.log("Calculated total donation to be: ¥" + moneyCount)
      db.close()   
      res.render('index', {moneyCount: moneyCount});

		})
  })
});

//Donate POST
app.post("/donate-req", function(req, res){
  console.log("donate post request recieved")
  //get post info
  var fullName = req.body.fullName
  var emailAddress = req.body.emailAddress
  var grade = req.body.grade
  var donationAmount = req.body.donationAmount
  var paymentMethod = req.body.paymentMethod
  var message = req.body.message
  var anonymousStatus = req.body.anonymousStatus

  console.log("request info: " + "|" + fullName + "|" + emailAddress + "|" + grade + "|" + donationAmount + "|" + paymentMethod + "|" + message + "|" + anonymousStatus + "|");
  
  //check availability
  // var availabilityCount = 0
  //
  // MongoClient.connect(url, function(err, db) {
  //   if (err) throw err
  //   var dbo = db.db(dbName)
  //   dbo.collection(collectionName).find({}).toArray(function(err, result) {
  //     if (err) throw err
  //     for (var i = 0; i < result.length; i++) {
  //       if (result[i].Time == time) {
  //         availabilityCount++
  //       }
  //     }
  //     console.log("Avalibility count:" + availabilityCount)
  //     db.close()
  //
  //     //control flow
  //     if (availabilityCount < maxPopulation) {
  //       //add entry to database
  //       console.log("Availabiligy check passed, adding to database")
  //       dbInsert(time, firstName, lastName, year, studentID);
  //       res.render("signuped", {time: time, firstName: firstName, lastName: lastName, year: year, studentID: studentID});
  //     }
  //     else{
  //       console.log("OOPS, ERROR, too many sign-ups")
  //       //Some Error Reporting Machanism
  //       res.render("info", {location: "index", infoTitle: "ERROR", infoMessage: "The selected time period is full, please select a different time and signup again. You don't need to pay again."})
  //     }
  //   });
  // });
});

//Signup Page 1
app.get("/signup/:timeSelect", function(req, res){
  var timeSelect = req.params.timeSelect;
  console.log("selected time is " + timeSelect)
  var T1Count = 0
  var T2Count = 0
  var T3Count = 0
  var T4Count = 0
  var T5Count = 0
  var T6Count = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection(collectionName).find({}).toArray(function(err, result) {
			if (err) throw err
			for (var i = 0; i < result.length; i++) {
				if (result[i].Time == "19:00-19:10") {
          T1Count++
        }
				if (result[i].Time == "19:10-19:20") {
          T2Count++
        }
        if (result[i].Time == "19:20-19:30") {
          T3Count++
        }
        if (result[i].Time == "19:35-19:45") {
          T4Count++
        }
        if (result[i].Time == "19:45-19:55") {
          T5Count++
        }
        if (result[i].Time == "19:55-20:05") {
          T6Count++
        }
      }
      console.log("count result: " + "|" + T1Count + "|" + T2Count + "|" + T3Count + "|" + T4Count + "|" + T5Count + "|" + T6Count + "|")
      db.close()   
      res.render('signup', {T1Count: T1Count, T2Count: T2Count, T3Count: T3Count, T4Count: T4Count, T5Count: T5Count, T6Count: T6Count, timeSelect: timeSelect, maxPopulation: maxPopulation})
		})
  })
});
//Signup Page 2
app.get("/signup", function(req, res){
  var timeSelect = 0;
  var T1Count = 0
  var T2Count = 0
  var T3Count = 0
  var T4Count = 0
  var T5Count = 0
  var T6Count = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection(collectionName).find({}).toArray(function(err, result) {
			if (err) throw err
			for (var i = 0; i < result.length; i++) {
				if (result[i].Time == "19:00-19:10") {
          T1Count++
        }
				if (result[i].Time == "19:10-19:20") {
          T2Count++
        }
        if (result[i].Time == "19:20-19:30") {
          T3Count++
        }
        if (result[i].Time == "19:35-19:45") {
          T4Count++
        }
        if (result[i].Time == "19:45-19:55") {
          T5Count++
        }
        if (result[i].Time == "19:55-20:05") {
          T6Count++
        }
      }
      console.log("count result: " + "|" + T1Count + "|" + T2Count + "|" + T3Count + "|" + T4Count + "|" + T5Count + "|" + T6Count + "|")
      db.close()   
      res.render('signup', {T1Count: T1Count, T2Count: T2Count, T3Count: T3Count, T4Count: T4Count, T5Count: T5Count, T6Count: T6Count, timeSelect: timeSelect, maxPopulation: maxPopulation})
		})
  })
});

//Data Page
app.get("/data", function(req, res){
  var T1Count = 0
  var T2Count = 0
  var T3Count = 0
  var T4Count = 0
  var T5Count = 0
  var T6Count = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection(collectionName).find({}).toArray(function(err, result) {
			if (err) throw err
      for (var i = 0; i < result.length; i++) {
				if (result[i].Time == "19:00-19:10") {
          T1Count++
        }
				if (result[i].Time == "19:10-19:20") {
          T2Count++
        }
        if (result[i].Time == "19:20-19:30") {
          T3Count++
        }
        if (result[i].Time == "19:35-19:45") {
          T4Count++
        }
        if (result[i].Time == "19:45-19:55") {
          T5Count++
        }
        if (result[i].Time == "19:55-20:05") {
          T6Count++
        }
      }
      console.log("count result: " + "|" + T1Count + "|" + T2Count + "|" + T3Count + "|" + T4Count + "|" + T5Count + "|" + T6Count + "|")
      db.close()   
      res.render('data', {T1Count: T1Count, T2Count: T2Count, T3Count: T3Count, T4Count: T4Count, T5Count: T5Count, T6Count: T6Count, dataList: result, maxPopulation: maxPopulation})
		})
  })
});

//Cancel Page
app.get("/cancel", function(req, res){
  res.render('cancel');
});

//Erase Page
app.get("/erase", function(req, res){
  res.render('erase');
});

//Cancel POST
app.post("/cancel", function(req, res){
  console.log("cancel post request recieved")
  //get post info
  var studentID = req.body.studentID
  var operationPassword = req.body.operationPassword
  console.log("request info: " + "|" + studentID + "|" + operationPassword + "|");
  
  //check password
  if (crypto.createHmac('sha256', operationPassword).digest('hex') == operationPasswordHash) {
    //Check ID availability
      MongoClient.connect(url, function(err, db) {
        if (err) throw err
        var dbo = db.db(dbName)
        dbo.collection(collectionName).find({StudentID: studentID}).toArray(function(err, result) {
          if (err) throw err
          if (result.length > 0) {
            dbRemove(studentID);
            res.render("info", {location: "data", infoTitle: "Operation Successful", infoMessage: "One occurance of " + studentID + " has been removed from the list"})
          }
          else {
            res.render("info", {location: "cancel", infoTitle: "ERROR", infoMessage: "The requested student ID is invalid, pleas try again."})
          }
        });
      });
  }
  else {
    res.render("info", {location: "cancel", infoTitle: "ERROR", infoMessage: "Wrong operation password, please try again"})  }
});

//Erase POST
app.post("/erase", function(req, res){
  console.log("erase post request recieved")
  //get post info
  var operationPassword = req.body.operationPassword
  var varificationQuestion = req.body.varificationQuestion
  console.log("request info: " + "|" + operationPassword + "|" + varificationQuestion + "|");
  
  //check password
  if (crypto.createHmac('sha256', operationPassword).digest('hex') == operationPasswordHash && varificationQuestion == 17) {
    dbRemoveAll();
    res.render("info", {location: "data", infoTitle: "Operation Successful", infoMessage: "All information has been erased."})
  }
  else {
    res.render("info", {location: "erase", infoTitle: "ERROR", infoMessage: "Wrong operation password or varification question answer, please try again."})
  }
});

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

dbInsert("Leon Lu", "2220056@ncpachina.org", 10, 3.14, "W", "Good Luck", false)

dbInsert("Leon Luu", "2220056@ncpachina.org", 10, 3.14, "W", "Good Luck", true)