var rem = require('rem');
var read = require('read');
var carrier = require('carrier');
var MongoClient = require('mongodb').MongoClient;
var mongo = require('./dbhelper');
var serialport = require('serialport')
var SerialPort = serialport.SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 9600,
  parser: serialport.parsers.readline("\n") 
}, false);
//var serialPort2 = new SerialPort("/dev/ttyACM1", {
 // baudrate: 57600,
 // parser: serialport.parsers.readline("\n") 
//}, false);
var ids_decode = {'1':"blue", '2':"green", '3':"pink", '4':"red", '5':"yellow"};
var directions_decode = {'1':"N", '2':"NE", '3':"E", '4':"SE", '5':"S", '6':"SW", '7':"W", '8':"NW"};
var ids_encode = {"blue":'1', "green":'2', "pink":'3', "red":'4', "yellow":'5'};
var directions_encode = {"N":'1', "NE":'2', "E":'3', "SE":'4', "S":'5', "SW":'6', "W":'7', "NW":'8'};

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
      if (json.user.name != "SwarmBots"){
        user_info= {sid:json.id_str, name:json.user.name, location:{name:json.user.location}, type:'tw',picture:{data:{url:json.user.profile_image_url}} }
        //autoRespond(json.user.screen_name);
        checkValidCommand(json.text, user_info, json.user.screen_name);
      }    
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
      if (text.indexOf("@IntroduceMeTo") > -1){
        sayHello(screen_name);
      }else{
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
          submitCommand("blue", user_info)
          acceptCommand(screen_name);
        }
      }
    }

    var submitCommand = function(bot, json){
      mongo.getSwarmBot(db, bot, function (err, sb){
        /*if (!sb.queue){
          sb.queue = [];
        }*/
        mongo.getQueue(db, function (err, queue){
          if(queue.people.indexOf(json.sid) > -1){
            declineDuplicate(json.user.screen_name);
          }else{
            queue.meta.push({name: json.name, photo: json.picture.data.url, location: json.location.name, sid:json.sid});
            queue.people.push(json.sid);
            //mongo.updateSwarmBot(db, sb, function (){
            mongo.updateQueue(db, queue, function (){
            });
            //});
          }
        });
      });
    } 

    var tweetQueue =[];

    var acceptCommand = function(screen_name){
      sendReceipt(screen_name);
    }

    var sendReceipt = function(screen_name){
      tweetQueue.push("@" + screen_name + " you have successfully moved our bots! Thanks!");
    }

    var sayHello = function(screen_name){
      tweetQueue.push("@" + screen_name + " no need to go through them. Hi!");
    }

    var declineDuplicate = function(screen_name){
      tweetQueue.push("@" + screen_name + " sorry, you can only be in the queue once. Try again once your turn is up!");
    }

    var declineCommand = function(screen_name){
      tweetQueue.push("@" + screen_name + " that is an invalid command.");
    }

    var tweet = function(){
      if (tweetQueue.length > 0){
        user('statuses/update').post({
          status: tweetQueue.shift()
        }, function (err, json){
          console.log("Tweet sent.");
        });
      }
    }

    setInterval(tweet, 60000);


    var dispatchQueue = [];



    serialPort.open(function () {
      serialPort.on('data', function(data) {
        //parseMessage(data);
        console.log(data);
      });
    
      var parseMessage = function(message){ 
        if(message.indexOf('response:') > -1){
          var resp = message.substring(message.length - 4, message.length)
          getNextMove(resp.split(""));
        }
      }

      var getNextMove = function(data){
        mongo.getQueue(db, function (err, queue){
          if (queue.people.length > 1){
            dispatchQueue.push(queue.people.shift());
            console.log(dispatchQueue);
          }
          mongo.updateQueue(db, queue, function (){
            dispatch();
          });
        });
      }

      var packageNewMessage = function(json){
        var message = json.client + json.bot + json.x.toString() + json.y.toString();
        sendNextMove(message);
      }

      var sendNextMove = function(message){
        dispatchQueue.push(message);
      }
    
      var dispatch = function(){
        if(dispatchQueue.length > 0){
          console.log("Writing to serial...");
          dispatchQueue.shift()
          serialPort.write("1234");
        }
      }

      var testMessage = function(){
        console.log("Writing test message...");
        serialPort.write("1234");
      }

      //setInterval(testMessage, 5000);
      setInterval(getNextMove, 1000);

    });
    
    

    
  });
});