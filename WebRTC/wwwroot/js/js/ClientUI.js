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
  
    const roomName = $("#txtJoinRoomName").val();

    invokeJoin(roomName);

    turnOnCamera();

    hideInitialElements();

});

$("#btnCreateRoom").click(function () {

    const roomName = $("#txtCreateRoomName").val();

    invokeCreateRoom(roomName);

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

$("#btnRecordStop").click(function () {

    stopRecordScreen();

});

function hideInitialElements() {
    $("#User-Info").hide();
    $("#Room-Info").hide();
    $("#Room-Join").hide();
}


function removeUser(userName) {

    var hashCode=userName.hashCode();

    document.querySelector('#remote-video-' + hashCode).remove();

    document.querySelector('#div-' + hashCode).remove();
}


function changeAudioTrackStatus(userName, isEnable) {

}

function changeVideoTrackStatus(userName, isEnable) {

}

function getUserVideoElement(userName) {

    var hashCode=userName.hashCode();

    const videoElement = `<div id="div-` + hashCode + `" class="card"><video width="358" height="300" id="remote-video-` + hashCode + `"  muted autoplay></video> </br> <b> ` + userName + `</b> </div>`;

    $(".basic-grid").append(videoElement);

    const remoteVideoElement = document.querySelector('#remote-video-' + hashCode);

    return remoteVideoElement;
}

function getLocalVideoElement() {

    const localVideoElement = document.querySelector('#localVideo');

    return localVideoElement;
}

function receiveMessage(userName, message){

}


function changedHost(userName, message){

}


function sendMessage(message){

    invokeSendMessage(message);
}

function hostJoiningConfirmation(userName){

}

function receiveHostJoiningResponse(responseStatusId){

}


function sendHostJoiningAnswer(roomName, userName){

   invokeSendHostJoiningAnswer(roomName, userName);
}

function joiningRequestToHost(roomName, userName){

   invokeJoiningRequestToHost(roomName, userName);
}