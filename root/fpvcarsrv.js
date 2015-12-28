var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8001});

console.log("Initializing...");

var mraa = require('mraa');

var pinST = new mraa.Pwm(19);
var pinTH = new mraa.Pwm(18);

var ST_center = 1500;
var ST_range = 350;
var TH_center = 1420;
var TH_range = 100;

function pinReset() {
  pinST.period_ms(20);                      
  pinST.pulsewidth_us(ST_center);                
  pinST.enable(true);
  pinTH.period_ms(20);
  pinTH.pulsewidth_us(TH_center);
  pinTH.enable(true);
}

var control_ws = null;

wss.on('error', function(err) {
  console.log("Error: %s", err);
});

wss.on('connection', function connection(ws) {

  if(control_ws) {
    // read only mode
    ws.on('close', function (code, message) {    
      console.log("Viewer is gone: %s, %s", code, message);
    });   
    ws.send('readonly mode');
    console.log("Viewer joined: %s", ws);
  }
  else {
    control_ws = ws;

    ws.on('close', function (code, message) {
      control_ws = null;
      console.log("Controller is gone: %s, %s", code, message);
      pinReset();
    });

    ws.on('message', function incoming(message) {
      //console.log('Command received: %s', message);

      var d = message.split(",");
      var st = Number(d[0]);
      var th = Number(d[1]);

      pinST.pulsewidth_us(st*ST_range/100 + ST_center);
      pinTH.pulsewidth_us(th*TH_range/100 + TH_center);      
    });

    ws.send('control mode');
    console.log("Controller joined: %s", ws);
    pinReset();
  }
});

pinReset();
console.log("Service started...");

