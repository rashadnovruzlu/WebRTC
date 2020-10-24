using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC.Hubs
{
    public enum SendType
    {
        Offer = 1,
        Answer,
        Candidate,
        Leave
    }

    public class TransferObject
    {
        public string Sender { get; set; }

        public string Receiver { get; set; }

        public int SendType { get; set; }

        public object Data { get; set; }
    }

    public class UserInfo
    {
        public string UserName { get; set; }

        public string RoomName { get; set; }
    }


    public class WebRTCHub : Hub<IRWebRTCHub>
    {
        private static ConcurrentDictionary<string, IList<string>> _rooms = new ConcurrentDictionary<string, IList<string>>();

        private static ConcurrentDictionary<string, UserInfo> _users = new ConcurrentDictionary<string, UserInfo>();

        public override Task OnDisconnectedAsync(Exception exception)
        {
            RemoveUserFromRoomAsync().Wait();

            return base.OnDisconnectedAsync(exception);
        }

        public async Task AudioTrackAsync(string userName, bool isEnable)
        {
            IReadOnlyList<string> subscribers = FindSubscribers();

            await Clients.Clients(subscribers).AudioTrackAsync(userName, isEnable);
        }

        public async Task VideoTrackAsync(string userName, bool isEnable)
        {
            IReadOnlyList<string> subscribers = FindSubscribers();

            await Clients.Clients(subscribers).VideoTrackAsync(userName, isEnable);
        }

        private IReadOnlyList<string> FindSubscribers()
        {
            var currentUser = _users[Context.ConnectionId];

            IList<string> users;

            if (!_rooms.TryGetValue(currentUser.RoomName, out users)) throw new Exception("Room not found.");

            IReadOnlyList<string> subscribers = FindConnetionIds(users).Where(x => x != Context.ConnectionId).ToList();

            return subscribers;
        }

        public void Join(string userName)
        {
            var user = new UserInfo { UserName = userName };

            _users.AddOrUpdate(Context.ConnectionId, user, (key, oldValue) => user);
        }

        public void CreateRoom(string roomName)
        {
            var result = _rooms.TryAdd(roomName, new List<string>());

            if (!result) throw new Exception("Room name already exists.");

        }

        private IReadOnlyList<string> FindConnetionIds(IList<string> users)
        {
            var userList = _users.Where(x => users.Contains(x.Value.UserName)).Select(x => x.Key).ToList();

            return userList;
        }

        public async Task JoinRoom(string roomName)
        {
            IList<string> users;

            if (!_rooms.TryGetValue(roomName, out users)) throw new Exception("Room not found.");

            var currentUser = _users[Context.ConnectionId];

            currentUser.RoomName = roomName;

            users.Add(currentUser.UserName);

            IReadOnlyList<string> subscribers = FindConnetionIds(users);

            await Clients.Clients(subscribers).AddedObservableListAsync(currentUser.UserName);

            await Clients.Caller.ConnectedUserListAsync(users.Where(x => x != currentUser.UserName).ToList());
        }

        public async Task LeaveRoomAsync()
        {
            await RemoveUserFromRoomAsync();
        }

        public async Task SendMessage(TransferObject transfferObject)
        {
            var user = _users.FirstOrDefault(x => x.Value.UserName == transfferObject.Receiver);

            if (user.Value != null)
            {
                string connectionId = user.Key;

                await Clients.Client(connectionId).ReceiveMessageAsync(transfferObject);
            }
        }

        private async Task RemoveUserFromRoomAsync()
        {
            var user = _users[Context.ConnectionId];

            if (user.RoomName != null)
            {
                var userList = _rooms[user.RoomName];

                userList.Remove(user.UserName);

                IReadOnlyList<string> subscribers = FindConnetionIds(userList);

                await Clients.Clients(subscribers).DeletedObservableListAsync(user.UserName);

                if (userList.Count == 0)
                {
                    _rooms.TryRemove(user.RoomName, out userList);
                }
            }
        }
    }

    public interface IRWebRTCHub
    {
        Task AddedObservableListAsync(string userName);

        Task DeletedObservableListAsync(string userName);

        Task ReceiveMessageAsync(TransferObject transferObject);

        Task ConnectedUserListAsync(IList<string> userList);

        Task AudioTrackAsync(string userName, bool isEnable);

        Task VideoTrackAsync(string userName, bool isEnable);


    }
}
