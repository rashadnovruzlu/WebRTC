var name;
var connectedUser;

var connection = new signalR.HubConnectionBuilder().withUrl("/webRTCHubx").build();

connection.on("ReceiveMessage", function (response) {

    console.log("Got message", response);

    

    switch (response.type) {
        case "login":
            handleLogin(response.data);
            break;
        //when somebody wants to call us 
        case "offer":
            handleOffer(response.data, response.name);
            break;
        case "answer":
            handleAnswer(response.data);
            break;
        //when a remote peer sends an ice candidate to us 
        case "candidate":
            handleCandidate(response.data);
            break;
        case "leave":
            handleLeave();
            break;
        default:
            break;
    } 
});


connection.start().then(function () {
     
}).catch(function (err) {
    return console.error(err.toString());
});


function send(message) {

    message.name = connectedUser;

    connection.invoke("SendMessage", message).catch(function (err) {
        return console.error(err.toString());
    });
}

function Join(userName) {

    connection.invoke("Join", userName).catch(function (err) {
        return console.error(err.toString());
    });
}
//****** 
//UI selectors block 
//******

var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');

var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var yourConn;
var stream;

callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) {
    name = usernameInput.value;

    if (name.length > 0) {
        Join(name);
    }

});

function handleLogin(success) {
    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        //********************** 
        //Starting a peer connection 
        //********************** 

        //getting local video stream 
        navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) {
            stream = myStream;

            //displaying local video stream on the page 
           
            try {
                localVideo.srcObject = stream;
            } catch (error) {
                localVideo.src = window.URL.createObjectURL(stream);
            }


            //using Google public stun server 
            var configuration = {
                "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
            };

            yourConn = new webkitRTCPeerConnection(configuration);

            // setup stream listening 
            yourConn.addStream(stream);

            //when a remote user adds stream to the peer connection, we display it 
            yourConn.onaddstream = function (e) {
               
                try {
                    remoteVideo.srcObject = e.stream;
                } catch (error) {
                    remoteVideo.src = window.URL.createObjectURL(e.stream);
                }
            };

            // Setup ice handling 
            yourConn.onicecandidate = function (event) {
                if (event.candidate) {
                    send({
                        type: "candidate",
                        data: event.candidate
                    });
                }
            };

        }, function (error) {
            console.log(error);
        });

    }
};

//initiating a call 
callBtn.addEventListener("click", function () {
    var callToUsername = callToUsernameInput.value;

    if (callToUsername.length > 0) {

        connectedUser = callToUsername;

        // create an offer 
        yourConn.createOffer(function (offer) {
            send({
                type: "offer",
                data: offer
            });

            yourConn.setLocalDescription(offer);
        }, function (error) {
            alert("Error when creating an offer");
        });

    }
});

//when somebody sends us an offer 
function handleOffer(offer, name) {
    connectedUser = name;
    yourConn.setRemoteDescription(new RTCSessionDescription(offer));

    //create an answer to an offer 
    yourConn.createAnswer(function (answer) {
        yourConn.setLocalDescription(answer);

        send({
            type: "answer",
            data: answer
        });

    }, function (error) {
        alert("Error when creating an answer");
    });
};

//when we got an answer from a remote user
function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user 
function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

//hang up 
hangUpBtn.addEventListener("click", function () {

    send({
        type: "leave"
    });

    handleLeave();
});

 