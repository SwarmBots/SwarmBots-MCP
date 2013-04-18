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
    
    user.stream('statuses/filter').get({'track': 'swarmbots'},function (err, stream) {
      carrier.carry(stream, function (line){
        if (line){
          var line = JSON.parse(line);
          parseTweet(line);
        }
      });
    });
    
    var parseTweet = function(json){
      //console.log(json.id_str, json.text, json.user);
      user_info= {sid:json.id_str, name:json.user.name, location:{name:json.user.location}, type:'tw',picture:{data:{url:json.user.profile_image_url}} }
      //autoRespond(json.user.screen_name);
      checkValidCommand(json.text, user_info, json.user.screen_name);
    }

    var autoRespond = function(screen_name){
      user('statuses/update').post({
        status: "@" + screen_name + " thanks for the interest, but we aren't accepting commands just yet."
      }, function (err, json){
        console.log("Posted");
      });
    }

    var checkValidCommand = function(text, user_info, screen_name){
      text = text.toLowerCase();
      if (text.indexOf("blue") > -1){
        submitCommand("blue", user_info)
        acceptCommand(screen_name);
      }else if (text.indexOf("green") > -1){
        submitCommand("green", user_info)
        acceptCommand(screen_name);
      }else if (text.indexOf("red") > -1){
        submitCommand("red", user_info)
        acceptCommand(screen_name);
      }else if (text.indexOf("pink") > -1){
        submitCommand("pink", user_info)
        acceptCommand(screen_name);
      }else if (text.indexOf("yellow") > -1){
        submitCommand("yellow", user_info)
        acceptCommand(screen_name);
      }else{
        declineCommand(screen_name);
      }
    }

    var submitCommand = function(bot, json){
      mongo.getSwarmBot(db, bot, function (err, sb){
        if (!sb.queue){
          sb.queue = [];
        }
        mongo.getQueue(db, function (err, queue){
          if(queue.people.indexOf(json.sid) > -1){
            declineDuplicate(json.user.screen_name);
          }else{
            sb.queue.push({name: json.name, photo: json.picture.data.url, location: json.location.name, sid:json.sid});
            queue.people.push(json.sid);
            mongo.updateSwarmBot(db, sb, function (){
              mongo.updateQueue(db, queue, function (){
              });
            });
          }
        });
      });
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
        status: "@" + screen_name + " sorry, you queue for one bot at a time."
      }, function (err, json){
        console.log("Command Declined, duplicate.");
      });
    }

    var declineCommand = function(screen_name){
      user('statuses/update').post({
        status: "@" + screen_name + " that is an invalid command."
      }, function (err, json){
        console.log("Command Declined, invalid.");
      });
    }

    var testMongo = function(){
      var fake_user1 = {sid: 'cool guy', screen_name: 'xx__coolguy__xx'};
      var fake_user2 = {sid: 'loser', screen_name: 'NotALoser'};
      mongo.updateTest(db, fake_user1, function(err,res){console.log(res);});
      mongo.updateTest(db, fake_user2, function(err,res){console.log(res);});
      mongo.getTest(db, 'loser', function(err, res){
        console.log(res);
        console.log(typeof res._id);
        res['newField'] = 'new info!';
        mongo.updateTest(db, res, function(err,res){console.log(res);});
      });
    }

    
  });
});