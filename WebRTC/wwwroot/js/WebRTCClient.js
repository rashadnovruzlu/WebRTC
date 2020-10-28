var _connection = new signalR.HubConnectionBuilder().withUrl("/webRTCHub").build();

var _connectedUserList;

const SendType = { "Offer": 1, "Answer": 2, "Candidate": 3 };

var _rtcConnections = [];

var _connectedUser = null;

const _callConfiguration = { video: true, audio: true };

var _localStream;

const _serverConfiguration = {
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

_connection.on("AddedObservableListAsync", function (userName) {

    console.log("Added new item:", userName);

    _connectedUserList.push(userName);

    if (userName !== _connectedUser) {

        createConnection(userName, 0);
    }

});

_connection.on("DeletedObservableListAsync", function (userName) {

    console.log("Deleted new item:", userName);

    for (var i = 0; i < _connectedUserList.length; i++) {

        if (_connectedUserList[i] === userName) {

            _connectedUserList.splice(i, 1);

            i--;
        }
    }

    delete _rtcConnections[userName];

    document.querySelector('#remote-video-' + userName).remove();

    document.querySelector('#div-' + userName).remove();

});

_connection.on("ConnectedUserListAsync", function (userList) {

    console.log("Connected user list:", userList);

    _connectedUserList = userList;

    for (var i = 0; i < _connectedUserList.length; i++) {

        createConnection(_connectedUserList[i], 1);

    }

});

_connection.on("AudioTrackAsync", function (userName, isEnable) {

    console.log("AudioTrackAsync:", isEnable);


});

_connection.on("VideoTrackAsync", function (userName, isEnable) {

    console.log("VideoTrackAsync:", isEnable);


});


_connection.on("ReceiveMessageAsync", function (response) {

    console.log("Got message", response);

    switch (response.sendType) {
        case SendType.Offer:
            handleOffer(response.sender, response.data);
            break;
        case SendType.Answer:
            handleAnswer(response.sender, response.data);
            break;
        case SendType.Candidate:
            handleCandidate(response.sender, response.data);
            break;
        default:
            break;
    }
});

_connection.start().then(function () {

}).catch(function (err) {
    return console.error(err.toString());
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function sendMessage(message) {

    message.Sender = _connectedUser;

    console.log("sendMessage:", message);

    _connection.invoke("SendMessage", message).catch(function (err) {
        return console.error(err.toString());
    });
}

function createConnection(userName, isCall) {

    console.log("createConnection:", userName);

    var videoElement = `<div id="div-` + userName + `" class="card"><video width="358" height="300" id="remote-video-` + userName + `"  muted autoplay></video> </br> <b> ` + userName + `</b> </div>`;

    $(".basic-grid").append(videoElement);

    navigator.webkitGetUserMedia(_callConfiguration, function (localStream) {

        let remoteVideo = document.querySelector('#remote-video-' + userName);

        _rtcConnections[userName] = new webkitRTCPeerConnection(_serverConfiguration);

        //_rtcConnections[userName].addStream(myStream);

        localStream.getTracks().forEach(function (track) {
            _rtcConnections[userName].addTrack(track, localStream);
        });

        _rtcConnections[userName].onaddstream = function (e) {

            try {

                remoteVideo.srcObject = e.stream;

            } catch (error) {
                remoteVideo.src = window.URL.createObjectURL(e.stream);
            }
        };

        _rtcConnections[userName].onicecandidate = function (event) {
            if (event.candidate) {
                sendMessage({
                    SendType: SendType.Candidate,
                    Receiver: userName,
                    Data: event.candidate
                });
            }
        };

        if (isCall === 1) call(userName);

    }, function (error) {
        console.log(error);
    });

}


function call(userName) {

    console.log("call:", userName);

    _rtcConnections[userName].createOffer(function (offer) {
        sendMessage({
            SendType: SendType.Offer,
            Receiver: userName,
            Data: offer
        });

        _rtcConnections[userName].setLocalDescription(offer);
    }, function (error) {
        alert("Error when creating an offer");
    });

}

function handleOffer(userName, offer) {

    console.log("handleOffer:", userName);

    _rtcConnections[userName].setRemoteDescription(new RTCSessionDescription(offer));

    _rtcConnections[userName].createAnswer(function (answer) {
        _rtcConnections[userName].setLocalDescription(answer);

        sendMessage({
            SendType: SendType.Answer,
            Receiver: userName,
            Data: answer
        });

    }, function (error) {
        alert("Error when creating an answer");
    });
}

function handleAnswer(userName, answer) {
    console.log("handleAnswer:", userName);

    _rtcConnections[userName].setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate(userName, candidate) {
    console.log("handleCandidate:", userName);

    _rtcConnections[userName].addIceCandidate(new RTCIceCandidate(candidate));
}

function turnOnMedia() {
    //getting local video stream 
    navigator.webkitGetUserMedia(_callConfiguration, function (myStream) {

        var localVideo = document.querySelector('#localVideo');

        _localStream = myStream;

        $("#connectedUser").html(_connectedUser);

        try {
            localVideo.srcObject = _localStream;
        } catch (error) {
            localVideo.src = window.URL.createObjectURL(_localStream);
        }

    }, function (error) {
        console.log(error);
    });
}

$(function () {
    $('#toggleVideo').change(function () {

        var value = $(this).prop('checked');


        for (var i = 0; i < _connectedUserList.length; i++) {

            let stream = _rtcConnections[_connectedUserList[i]].getLocalStreams()[0];

            stream.getVideoTracks()[0].enabled = value;
        }

        _localStream.getVideoTracks()[0].enabled = value;

        _connection.invoke("VideoTrackAsync", _connectedUser, value).catch(function (err) {
            return console.error(err.toString());
        });

    });
    $('#toggleVoice').change(function () {

        var value = $(this).prop('checked');

        for (var i = 0; i < _connectedUserList.length; i++) {

            let stream = _rtcConnections[_connectedUserList[i]].getLocalStreams()[0];

            stream.getAudioTracks()[0].enabled = value;
        }

        _localStream.getAudioTracks()[0].enabled = value;

        _connection.invoke("AudioTrackAsync", _connectedUser, value).catch(function (err) {
            return console.error(err.toString());
        });


    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////

$("#btnLogin").click(function () {

    _connectedUser = $("#txtUserName").val();

    _connection.invoke("Join", _connectedUser).catch(function (err) {
        return console.error(err.toString());
    });

});

$("#btnCreateRoom").click(function () {

    var roomName = $("#txtCreateRoomName").val();

    _connection.invoke("CreateRoom", roomName).catch(function (err) {
        return console.error(err.toString());
    });

});

$("#btnJoinRoom").click(function () {

    var roomName = $("#txtJoinRoomName").val();

    _connection.invoke("JoinRoom", roomName).catch(function (err) {
        return console.error(err.toString());
    });

    turnOnMedia();

    hide();

});

function hide() {
    $("#User-Info").hide();
    $("#Room-Info").hide();
    $("#Room-Join").hide();
}


var displayMediaStream;

async function shareScreen() {


    displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
     
    let videoTrack = displayMediaStream.getVideoTracks()[0];

    for (var i = 0; i < _connectedUserList.length; i++) {

        let sender = _rtcConnections[_connectedUserList[i]].getSenders().find(function (s) {
            return s.track.kind === videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    }

    var localVideo = document.querySelector('#localVideo');

    localVideo.srcObject = displayMediaStream;


    videoTrack.onended = function () {
        stopShareScreen();
    };
}



function stopShareScreen() {

    let videoTrack = _localStream.getVideoTracks()[0];

    for (var i = 0; i < _connectedUserList.length; i++) {

        let sender = _rtcConnections[_connectedUserList[i]].getSenders().find(function (s) {
            return s.track.kind === videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    }

    localVideo.srcObject = _localStream;
}


async function recordScreen() {
    let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    let recorder = new RecordRTCPromisesHandler(stream, {
        type: 'video',
        mimeType: 'video/mp4'
    });
    recorder.startRecording();

    const sleep = m => new Promise(r => setTimeout(r, m));
    await sleep(10000);

    await recorder.stopRecording();
    let blob = await recorder.getBlob();
    invokeSaveAsDialog(blob);
}