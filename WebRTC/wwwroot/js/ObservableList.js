var connection = new signalR.HubConnectionBuilder().withUrl("/rWebRTCHub").build();

connection.on("AddedObservableList", function (item) {

    console.log("Added new item:", item);


});

connection.on("DeletedObservableList", function (item) {

    console.log("Deleted new item:", item);


});

connection.start().then(function () {

}).catch(function (err) {
    return console.error(err.toString());
});
