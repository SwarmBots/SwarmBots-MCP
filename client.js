var rem = require('rem');
var read = require('read');
var carrier = require('carrier');

// Create Twitter API, prompting for key/secret.
var tw = rem.connect('twitter.com', 1).configure({
  'key': process.env.TW_SWARMBOTS_KEY,
  'secret':  process.env.TW_SWARMBOTS_SECRET
}).promptAuthentication(function(err, user){

  // Pass the statuses/sample stream to a JSON parser and print only the tweets.
  user.stream('statuses/filter').get({'track': 'swarmbots'},function (err, stream) {
    carrier.carry(stream, function(line){
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
});




