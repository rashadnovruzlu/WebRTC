var _currentUser = null;

 
    $('#toggleVideo').change(function () {

        const isEnable = $(this).prop('checked');

        changeCameraStatus(isEnable);

        invokeVideoTrack(isEnable);

    });

    $('#toggleVoice').change(function () {

        const isEnable = $(this).prop('checked');

        changeAudioStatus(isEnable);

        invokeAudioTrack(isEnable);

    });

 


$("#btnLogin").click(function () {

    _currentUser = $("#txtUserName").val();

    invokeJoin();

});

$("#btnCreateRoom").click(function () {

    const roomName = $("#txtCreateRoomName").val();

    invokeCreateRoom(roomName);

});


$("#btnJoinRoom").click(function () {

    const roomName = $("#txtJoinRoomName").val();

    invokeJoinRoom(roomName);

    turnOnCamera();

    hideInitialElements();

});

$("#btnShareScreen").click(function () {
    startShareScreen();
});


$("#btnStopShareScreen").click(function () {
    stopShareScreen();
});

$("#btnRecordStart").click(function () {

    startRecordScreen();

});

$("#btnStopShareScreen").click(function () {

    stopRecordScreen

});

function hideInitialElements() {
    $("#User-Info").hide();
    $("#Room-Info").hide();
    $("#Room-Join").hide();
}


function removeUser(userName) {

    document.querySelector('#remote-video-' + userName).remove();

    document.querySelector('#div-' + userName).remove();
}


function changeAudioTrackStatus(userName, isEnable) {

}

function changeVideoTrackStatus(userName, isEnable) {

}

function getUserVideoElement(userName) {

    const videoElement = `<div id="div-` + userName + `" class="card"><video width="358" height="300" id="remote-video-` + userName + `"  muted autoplay></video> </br> <b> ` + userName + `</b> </div>`;

    $(".basic-grid").append(videoElement);

    const remoteVideoElement = document.querySelector('#remote-video-' + userName);

    return remoteVideoElement;
}

function getLocalVideoElement() {

    const localVideoElement = document.querySelector('#localVideo');

    return localVideoElement;
}