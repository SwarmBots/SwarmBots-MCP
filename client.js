var rem = require('rem');
var read = require('read');
var carrier = require('carrier');
var MongoClient = require('mongodb').MongoClient;
var mongo = require('./dbhelper');
var SerialPort = require('serialport').SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600
});



MongoClient.connect(process.env.SWARMBOTS_MONGO_URI, function (err, db){
  

  // Create Twitter API, prompting for key/secret.
  var tw = rem.connect('twitter.com', 1).configure({
    'key': process.env.TW_SWARMBOTS_KEY,
    'secret':  process.env.TW_SWARMBOTS_SECRET
  }).promptAuthentication(function (err, user){
    /*
    user.stream('statuses/filter').get({'track': 'swarmbots'},function (err, stream) {
      carrier.carry(stream, function (line){
        if (line){
          var line = JSON.parse(line);
          parseTweet(line);
        }
      });
    });
    */
    var parseTweet = function(json){
      console.log(json.id_str, json.text, json.user);
      autoRespond(json.user.screen_name);
    }

    var autoRespond = function(screen_name){
      user('statuses/update').post({
        status: "@" + screen_name + " thanks for the interest, but we aren't accepting commands just yet."
      }, function (err, json){
        console.log("Posted");
      });
    }

    var checkValidCommand = function(text, user_info, screen_name){
      if (text){
        acceptCommand(screen_name);
      }else{
        declineCommand(screen_name);
      }
    }

    var acceptCommand = function(screen_name){
      sendReceipt(screen_name);
    }

    var sendReceipt= function(screen_name){
      user('statuses/update').post({
        status: "@" + screen_name + " your command has been added to the queue. Thank you!"
      }, function (err, json){
        console.log("Confirmation sent.");
      });
    }

    var declineCommand = function(screen_name){
      user('statuses/update').post({
        status: "@" + screen_name + " that is an invalid command."
      }, function (err, json){
        console.log("Command Declined.");
      });
    }

    var testMongo = function(){
      var fake_user1 = {name: 'cool guy', screen_name: 'xx__coolguy__xx'};
      var fake_user2 = {name: 'loser', screen_name: 'NotALoser'};
      mongo.updateTest(db, fake_user1, function(err,res){console.log(res);});
      mongo.updateTest(db, fake_user2, function(err,res){console.log(res);});
      mongo.getTest(db, 'loser', {}, function(err, res){
        console.log(res);
        res['newField'] = 'new info!';
        mongo.updateTest(db, res, function(err,res){console.log(res);});
      });
    }


    testMongo();

  });
});