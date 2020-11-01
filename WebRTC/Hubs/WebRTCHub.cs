using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebRTC.Models;

namespace WebRTC.Hubs
{
    //Host cixis etse ve ya host deyisse
    public class WebRTCHub : Hub<IRWebRTCHub>
    {
        private static ConcurrentDictionary<string, Room> _rooms = new ConcurrentDictionary<string, Room>();

        private static ConcurrentDictionary<string, UserInfo> _users = new ConcurrentDictionary<string, UserInfo>();

        public override Task OnDisconnectedAsync(Exception exception)
        {
            RemoveUserFromRoomAsync().Wait();

            return base.OnDisconnectedAsync(exception);
        }

        public async Task AudioTrackAsync(string userName, bool isEnable)
        {
            IReadOnlyList<string> subscribers = FindSubscribers();

            await Clients.Clients(subscribers).AudioTrack(userName, isEnable);
        }

        public async Task VideoTrackAsync(string userName, bool isEnable)
        {
            IReadOnlyList<string> subscribers = FindSubscribers();

            await Clients.Clients(subscribers).VideoTrack(userName, isEnable);
        }

        private IReadOnlyList<string> FindSubscribers()
        {
            var currentUser = _users[Context.ConnectionId];

            Room room;

            if (!_rooms.TryGetValue(currentUser.RoomName, out room)) throw new Exception("Room not found.");

            IList<string> users = room.Users;

            IReadOnlyList<string> subscribers = FindConnetionIds(users).Where(x => x != Context.ConnectionId).ToList();

            return subscribers;
        }

        public async Task Join(string roomName, string userName)
        {
            if (string.IsNullOrWhiteSpace(roomName) || string.IsNullOrWhiteSpace(userName)) throw new Exception("Room name and user name is required!");

            var user = new UserInfo { UserName = userName };

            _users.AddOrUpdate(Context.ConnectionId, user, (key, oldValue) => user);

            await JoinRoom(roomName);
        }

        public async Task CreateRoom(string roomName, string userName)
        {
            if (string.IsNullOrWhiteSpace(roomName) || string.IsNullOrWhiteSpace(userName)) throw new Exception("Room name and user name is required!");

            var result = _rooms.TryAdd(roomName, new Room { RoomName = roomName, HostConnectionId = Context.ConnectionId });

            if (!result) throw new Exception("Room name already exists.");

            await Join(roomName, userName);
        }

        private IReadOnlyList<string> FindConnetionIds(IList<string> users)
        {
            var userList = _users.Where(x => users.Contains(x.Value.UserName)).Select(x => x.Key).ToList();

            return userList;
        }

        private async Task JoinRoom(string roomName)
        {
            Room room;

            if (!_rooms.TryGetValue(roomName, out room)) throw new Exception("Room not found.");

            var currentUser = _users[Context.ConnectionId];

            var users = room.Users;

            currentUser.RoomName = roomName;

            users.Add(currentUser.UserName);

            IReadOnlyList<string> subscribers = FindConnetionIds(users);

            await Clients.Clients(subscribers).AddedObservableCollection(currentUser.UserName);

            await Clients.Caller.ConnectedUsers(users.Where(x => x != currentUser.UserName).ToList());
        }

        public async Task LeaveRoomAsync()
        {
            await RemoveUserFromRoomAsync();
        }

        public async Task SendHandshakeInfo(TransferObject transfferObject)
        {
            var user = _users.FirstOrDefault(x => x.Value.UserName == transfferObject.Receiver);

            if (user.Value != null)
            {
                string connectionId = user.Key;

                await Clients.Client(connectionId).ReceiveSendHandshakeInfo(transfferObject);
            }
        }

        public async Task SendMessage(string message)
        {
            Room room;

            var currentUser = _users[Context.ConnectionId];

            if (!_rooms.TryGetValue(currentUser.RoomName, out room)) throw new Exception("Room not found.");

            var users = room.Users;

            IReadOnlyList<string> subscribers = FindConnetionIds(users);

            await Clients.Clients(subscribers).ReceiveMessage(currentUser.UserName, message);
        }

        public async Task JoiningRequestToHost(string roomName, string userName)
        {
            Room room;

            if (!_rooms.TryGetValue(roomName, out room)) throw new Exception("Room not found.");

            await Clients.Client(room.HostConnectionId).HostJoiningConfirmation(userName);
        }

        public async Task SendHostJoiningAnswer(string userName, int responseStatusId)
        {
            var user = _users.FirstOrDefault(x => x.Value.UserName == userName);

            await Clients.Client(user.Key).ReceiveHostJoiningResponse(responseStatusId);
        }

        public async Task ChangeRoomHost(string roomName, string userName)
        {
            var user = _users.FirstOrDefault(x => x.Value.UserName == userName);

            var room = _rooms[roomName];

            if (room.HostConnectionId != Context.ConnectionId) throw new Exception("Access denied.");

            room.HostConnectionId = user.Key;

            await Clients.Client(user.Key).ChangedHost();
        }




        private async Task RemoveUserFromRoomAsync()
        {
            UserInfo user;

            if (!_users.TryGetValue(Context.ConnectionId, out user)) return;

            if (user.RoomName != null)
            {
                var room = _rooms[user.RoomName];

                var userList = room.Users;

                userList.Remove(user.UserName);

                if (room.HostConnectionId == Context.ConnectionId && userList.Count > 0)
                {
                    room.HostConnectionId = userList.First();
                }

                if (userList.Count == 0)
                {
                    _rooms.TryRemove(user.RoomName, out room);
                }
                else
                {
                    IReadOnlyList<string> subscribers = FindConnetionIds(userList);

                    await Clients.Clients(subscribers).DeletedObservableCollection(user.UserName);
                }
            }

            _users.Remove(Context.ConnectionId, out user);
        }


    }

    public interface IRWebRTCHub
    {
        Task AddedObservableCollection(string userName);

        Task DeletedObservableCollection(string userName);

        Task ReceiveSendHandshakeInfo(TransferObject transferObject);

        Task ConnectedUsers(IList<string> userList);

        Task AudioTrack(string userName, bool isEnable);

        Task VideoTrack(string userName, bool isEnable);

        Task ReceiveMessage(string userName, string message);

        Task ReceiveHostJoiningResponse(int responseStatusId);

        Task HostJoiningConfirmation(string userName);

        Task ChangedHost();
    }
}
