var SerialPort = require('serialport').SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 57600
});
var serialPort2 = new SerialPort("/dev/ttyACM1", {
  baudrate: 57600
});



serialPort.on("open", function () {
  console.log('open');
  serialPort.on('data', function(data) {
    console.log('data received: ' + data);
  });  
  serialPort.write("T\n", function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });  
});

serialPort2.on("open", function () {
  console.log('open');
  serialPort.on('data', function(data) {
    console.log('data received: ' + data);
  });  
  serialPort.write("t\n", function(err, results) {
     console.log('err ' + err);
     console.log('results ' + results);
  });  
});