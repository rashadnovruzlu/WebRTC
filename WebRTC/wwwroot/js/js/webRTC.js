const _webRTCServerConfiguration = {
    "iceServers": [{
        "urls": "stun:stun.l.google.com:19302"
    },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    }
    ]
};

const _webRTCCallConfiguration = {
    video: true,
    audio: true
};

var _webRTCConnections = [];

var _webRTCLocalStream ;

var _complateBlob;

var _recorder;

var _recordMediaStream ;


function createWebRTCConnection(userName) {

    return new Promise((resolve, reject) => {

        navigator.webkitGetUserMedia(_webRTCCallConfiguration, function (localStream) {

            const remoteVideo = getUserVideoElement(userName);

            _webRTCConnections[userName] = new webkitRTCPeerConnection(_webRTCServerConfiguration);

            localStream.getTracks().forEach(function (track) {
                _webRTCConnections[userName].addTrack(track, localStream);
            });

            _webRTCConnections[userName].onaddstream = function (e) {

                try {

                    remoteVideo.srcObject = e.stream;

                } catch (error) {
                    remoteVideo.src = window.URL.createObjectURL(e.stream);
                }
            };

            _webRTCConnections[userName].onicecandidate = function (event) {
                if (event.candidate) {
                    invokeSendHandshakeInfo({
                        SendType: SendType.Candidate,
                        Receiver: userName,
                        Data: event.candidate
                    });
                }
            };

            resolve(userName);

        }, function (error) {
            reject(error);
        });
    });

}

function webRTCCreateOffer(userName) {

    _webRTCConnections[userName].createOffer(function (offer) {
        invokeSendHandshakeInfo({
            SendType: SendType.Offer,
            Receiver: userName,
            Data: offer
        });

        _webRTCConnections[userName].setLocalDescription(offer);

    }, function (error) {
        alert("Error when creating an offer:", error);
    });

}

function handleOffer(userName, offer) {

    _webRTCConnections[userName].setRemoteDescription(new RTCSessionDescription(offer));

    _webRTCConnections[userName].createAnswer(function (answer) {

        _webRTCConnections[userName].setLocalDescription(answer);

        invokeSendHandshakeInfo({
            SendType: SendType.Answer,
            Receiver: userName,
            Data: answer
        });

    }, function (err) {
        console.error(`Error when creating an answer: ${err.toString()}`);
    });
}

function handleAnswer(userName, answer) {

    _webRTCConnections[userName].setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate(userName, candidate) {

    _webRTCConnections[userName].addIceCandidate(new RTCIceCandidate(candidate));
}

function turnOnCamera() {

    navigator.webkitGetUserMedia(_webRTCCallConfiguration, function (myStream) {

        const localVideo = getLocalVideoElement();

        _webRTCLocalStream = myStream;

        try {

            localVideo.srcObject = _webRTCLocalStream;

        } catch (error) {

            localVideo.src = window.URL.createObjectURL(_webRTCLocalStream);
        }

    }, function (err) {
        console.error(`Error when creating an answer: ${err.toString()}`);
    });
}

function changeCameraStatus(isEnable) {

    for (let i = 0; i < _connectedUsers.length; i++) {

        const stream = _webRTCConnections[_connectedUsers[i]].getLocalStreams()[0];

        stream.getVideoTracks()[0].enabled = isEnable;
    }

    _webRTCLocalStream.getVideoTracks()[0].enabled = isEnable;
}

function changeAudioStatus(isEnable) {

    for (let i = 0; i < _connectedUsers.length; i++) {

        const stream = _webRTCConnections[_connectedUsers[i]].getLocalStreams()[0];

        stream.getAudioTracks()[0].enabled = isEnable;
    }

    _webRTCLocalStream.getAudioTracks()[0].enabled = isEnable;
}


async function startShareScreen() {

    const displayMediaStream = await navigator.mediaDevices.getDisplayMedia();

    let videoTrack = displayMediaStream.getVideoTracks()[0];

    for (let i = 0; i < _connectedUsers.length; i++) {

        let sender = _webRTCConnections[_connectedUsers[i]].getSenders().find(function (s) {
            return s.track.kind === videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    }

    const localVideo = getLocalVideoElement();

    localVideo.srcObject = displayMediaStream;


    videoTrack.onended = function () {
        stopShareScreen();
    };
}

function stopShareScreen() {

    let videoTrack = _webRTCLocalStream.getVideoTracks()[0];

    for (let i = 0; i < _connectedUsers.length; i++) {

        let sender = _webRTCConnections[_connectedUsers[i]].getSenders().find(function (s) {
            return s.track.kind === videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    }

    const localVideo = getLocalVideoElement();

    localVideo.srcObject.getVideoTracks()[0].stop()

    localVideo.srcObject = _webRTCLocalStream;
}



async function startRecordScreen() {

    _recordMediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" }
    });

    var audioTrack = _webRTCLocalStream.getAudioTracks()[0];

    _recordMediaStream.addTrack(audioTrack);

    _recorder= new MediaRecorder(_recordMediaStream);

    const chunks = [];

    _recorder.ondataavailable = e => chunks.push(e.data);

    _recorder.start();

    _recorder.onstop = e => {
      
        _complateBlob = new Blob(chunks, { type: chunks[0].type });
         
    };
}

function stopRecordScreen() {

    _recorder.stop();

    _recordMediaStream.getTracks().forEach(function (track) {
        track.stop();
    });
}

 