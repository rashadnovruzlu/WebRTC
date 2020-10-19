using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC.Hubs
{

    public class UserInfo
    {
        public string UserName { get; set; }
    
        public string RoomName { get; set; }
    }


    public class RWebRTCHub : Hub<IRWebRTCHub>
    {
        private static ConcurrentDictionary<string, IList<string>> _rooms = new ConcurrentDictionary<string, IList<string>>();

        private static ConcurrentDictionary<string, UserInfo> _users = new ConcurrentDictionary<string, UserInfo>();

        public override Task OnDisconnectedAsync(Exception exception)
        {
            RemoveUserFromRoom();

            return base.OnDisconnectedAsync(exception);
        }

        public void JoinHub(string userName)
        {
            var user = new UserInfo();

            _users.AddOrUpdate(Context.ConnectionId, user, (key, oldValue) => user);
        }

        public void CreateRoom(string roomName)
        {
            var result = _rooms.TryAdd(roomName, new List<string>());

            if (!result) throw new Exception("Room name already exists.");

        }

        public void JoinRoom(string roomName)
        {
            IList<string> users;

            if (_rooms.TryGetValue(roomName, out users)) throw new Exception("Room not found.");

            var user = _users[Context.ConnectionId];

            user.RoomName = roomName;

            users.Add(user.UserName);

            IReadOnlyList<string> subscribers = users.ToList();

            Clients.Clients(subscribers).AddedObservableList(user.UserName);
        }
     
        public void LeaveRoom()
        {
            RemoveUserFromRoom();
        }

        private void RemoveUserFromRoom()
        {
            var user = _users[Context.ConnectionId];

            if (user.RoomName != null)
            {
                var userList = _rooms[user.RoomName];

                userList.Remove(user.UserName);

                IReadOnlyList<string> subscribers = userList.ToList();

                Clients.Clients(subscribers).DeletedObservableList(user.UserName);
            }
        }
    }

    public interface IRWebRTCHub
    {
        void AddedObservableList(string userName);

        void DeletedObservableList(string userName);
    }
}
