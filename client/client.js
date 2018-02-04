var Peer = require('simple-peer');
var io = require('socket.io-client');
var socket = io.connect();


// socket connection
socket.on('connect', function() {
  console.log('Connected to signalling server, Peer ID: %s', socket.id);
  navigator.getUserMedia({ video: true, audio: false }, gotMedia, function () {
    console.log("couldnt get video");
  });
});


function gotMedia (stream) {

  console.log("video stream: ", stream);

  // Populate videostream to local video
  var video = document.getElementById('localVideo');
  video.src = window.URL.createObjectURL(stream);

  // Create local peer connection
  var localPeer;

  // request server peer
  socket.emit('connectToPeer', {peerId: socket.id});

  // serverpeer was assigned
  socket.on('serverPeer-ready', (data) => {
    localPeer = new Peer({
      initiator: true,
      stream: stream,
      offerConstraints: {
        mandatory: {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: true
        }
      }
    });

    var peerId = data.peerId;
    console.log('serverPeer available for connection: %s', peerId);

    // receive signals from serverPeer
    socket.on('signal', function(data) {
      console.log('Received signalling data', data, 'from Peer ID:', peerId);
      localPeer.signal(data.signal);
    });

    // send signals to serverPeer
    localPeer.on('signal', function(data) {
      console.log('Advertising signalling data', data, 'to Peer ID:', peerId);
      socket.emit('signal', {
        signal: data,
        peerId: peerId
      });
    });






    localPeer.on('connect', function() {
      console.log('Peer connection established');
      setInterval(() => {
        console.log("sending Test");
        localPeer.send("Test");
      }, 2000);
    });

    localPeer.on('data', function(data) {
      console.log('Recieved data from peer:', data);
    });

  });
}