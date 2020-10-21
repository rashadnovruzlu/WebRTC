var _connection = new signalR.HubConnectionBuilder().withUrl("/webRTCHub").build();

var _connectedUserList;

const SendType = { "Offer": 1, "Answer": 2, "Candidate": 3 };

var _rtcConnections = new Array();

var _connectedUser = null;

const _callConfiguration = { video: true, audio: true };


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

    if (userName !== _connectedUser) {

        createConnection(userName, 0);

    }

});

_connection.on("DeletedObservableListAsync", function (userName) {

    console.log("Deleted new item:", userName);

    delete _rtcConnections[userName];

    document.querySelector('#remote-video-' + userName).remove();
});

_connection.on("ConnectedUserListAsync", function (userList) {

    console.log("Connected user list:", userList);

    _connectedUserList = userList;

    for (var i = 0; i < _connectedUserList.length; i++) {

        createConnection(_connectedUserList[i], 1);

    }

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

    var videoElement = `<div class="card"><video width="358" height="300" id="remote-video-` + userName + `"  muted autoplay></video></div>`;

    $(".basic-grid").append(videoElement);

    navigator.webkitGetUserMedia(_callConfiguration, function (myStream) {

        let remoteVideo = document.querySelector('#remote-video-' + userName);

        _rtcConnections[userName] = new webkitRTCPeerConnection(_serverConfiguration);

        _rtcConnections[userName].addStream(myStream);

        _rtcConnections[userName].onaddstream = function (e) {

            try {
                console.log('///////////////////////////////////////////////////////////////////////////////////////////////////////////');
                console.log('onaddstream:', userName);
                console.log('e.stream:', e.stream);
                remoteVideo.srcObject = e.stream;
                console.log('///////////////////////////////////////////////////////////////////////////////////////////////////////////');

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

        try {
            localVideo.srcObject = myStream;
        } catch (error) {
            localVideo.src = window.URL.createObjectURL(myStream);
        }

    }, function (error) {
        console.log(error);
    });
}



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