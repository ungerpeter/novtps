const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const Peer = require('simple-peer');
const wrtc = require('wrtc');
const morgan = require('morgan');

let app = express();

app.use(morgan('dev'));
app.use(express.static('./static'));

app.get('/', function (req, res) {
  //res.send('Hello World!');
});

const options = {
  key: fs.readFileSync( './certs/server.key' ),
  cert: fs.readFileSync( './certs/server.crt' ),
  requestCert: false,
  rejectUnauthorized: false
};

let server = http.createServer(app);
let httpsServer = https.createServer(options, app);
let io = require('socket.io')(server);

server.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

httpsServer.listen(3443, function () {
  console.log('Example secure app listening on port 3443!');
});



let sockets = [];
let serverPeers = [];

io.on('connection', function (socket) {

  // Client socket connects
  console.log('Connection with ID:', socket.id);

  // Client requests peer connection with server
  socket.on('connectToPeer', function(clientPeer) {
    console.log('Connection with ID requests serverPeer:', clientPeer.peerId);

    // Create new serverPeer
    let serverPeer = new Peer({
      wrtc: wrtc,
      initiator: false,
      trickle: true,
      answerConstraints: {
        mandatory: {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
        }
      }
    });
    let serverPeerId = 's_' + socket.id;
    serverPeers[serverPeerId] = serverPeer;
    console.log('Created serverPeer with ID:', serverPeerId);

    // serverPeer ready
    socket.emit('serverPeer-ready', {
      peerId: serverPeerId
    });

    // client sends signal to serverPeer
    socket.on('signal', function(data) {
      console.log("received signal from socket:", socket.id);
      serverPeer.signal(data.signal);
    });

    // server sends signal to clientPeer
    serverPeer.on('signal', (signal) => {
      console.log("transmit signal to socket:", socket.id);
      socket.emit('signal', {
        signal: signal
      });
    });


    serverPeer.on('connect', function() {
      console.log('Peer connection established');
    });

    serverPeer.on('data', function(data) {
      console.log('Recieved data from peer:', data);
    });

    serverPeer.on('stream', function(stream) {
      console.log("receiving stream");
      console.log(stream);
    });

  });

});