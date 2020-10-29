const _signalRHubUrl = "/webRTCHub";

var _connectedUsers = [];

const _signalRConnection = new signalR.HubConnectionBuilder().withUrl(_signalRHubUrl).build();

_signalRConnection.on("AddedObservableCollection", function (userName) {

    _connectedUsers.push(userName);

    if (userName !== _currentUser) {

        createWebRTCConnection(userName, 0);
    }

});

_signalRConnection.on("DeletedObservableCollection", function (userName) {

    for (let i = 0; i < _connectedUsers.length; i++) {

        if (_connectedUsers[i] === userName) {

            _connectedUsers.splice(i, 1);

            i--;
        }
    }

    delete _webRTCConnections[userName];

    removeUser(userName);

});

_signalRConnection.on("ConnectedUsers", function (users) {

    _connectedUsers = users;

    for (let i = 0; i < _connectedUsers.length; i++) {

        createWebRTCConnection(_connectedUsers[i]).then((userName) => {
            webRTCCreateOffer(userName);
        });

    }

});

_signalRConnection.on("AudioTrackStatus", function (userName, isEnable) {

    changeAudioTrackStatus(userName, isEnable);

});


_signalRConnection.on("VideoTrack", function (userName, isEnable) {

    changeVideoTrackStatus(userName, isEnable);
});


_signalRConnection.on("ReceiveMessage", function (response) {

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


_signalRConnection.start().then(function () {

}).catch(function (err) {
    return console.error(err.toString());
});


function invokeSendMessage(message) {

    message.Sender = _currentUser;

    _signalRConnection.invoke("SendMessage", message).catch(function (err) {
        return console.error(err.toString());
    });
}

function invokeVideoTrack(isEnable) {

    _signalRConnection.invoke("VideoTrackAsync", _currentUser, isEnable).catch(function (err) {
        return console.error(err.toString());
    });

}

function invokeAudioTrack(isEnable) {

    _signalRConnection.invoke("AudioTrackAsync", _currentUser, isEnable).catch(function (err) {
        return console.error(err.toString());
    });

}

function invokeJoin() {

    _signalRConnection.invoke("Join", _currentUser).catch(function (err) {
        return console.error(err.toString());
    });
}

function invokeCreateRoom(roomName) {

    _signalRConnection.invoke("CreateRoom", roomName).catch(function (err) {
        return console.error(err.toString());
    });
}

function invokeJoinRoom(roomName) {

    _signalRConnection.invoke("JoinRoom", roomName).catch(function (err) {
        return console.error(err.toString());
    });
}