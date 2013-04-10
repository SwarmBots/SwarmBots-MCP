var rem = require('rem');
var read = require('read');
var carrier = require('carrier');
var MongoClient = require('mongodb').MongoClient;
var SerialPort = require('serialport').SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600
});



MongoClient.connect(process.env.SWARMBOTS_MONGO_URI, function (err, db){
  if(err) {return console.dir(err); }

  var collection = db.collection('test');
  var SBUsers = db.collection('users');
  collection.save({'hello': 'test'}, function (err, result){
    console.log(result);
  });

  // Create Twitter API, prompting for key/secret.
  var tw = rem.connect('twitter.com', 1).configure({
    'key': process.env.TW_SWARMBOTS_KEY,
    'secret':  process.env.TW_SWARMBOTS_SECRET
  }).promptAuthentication(function (err, user){

    // Pass the statuses/sample stream to a JSON parser and print only the tweets.
    user.stream('statuses/filter').get({'track': 'swarmbots'},function (err, stream) {
      carrier.carry(stream, function (line){
        if (line){
          var line = JSON.parse(line);
          parseTweet(line);
        }
      });
    });

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

    var addCommand = function (user_data){
      SBUsers.update({screen_name: user_data.screen_name}, 
      {
        
      } ,{upsert: 1}).

    }


  });
});



