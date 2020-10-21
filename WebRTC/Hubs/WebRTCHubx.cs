using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC
{
    public class TransfferObject
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public object Data { get; set; }
    }


    public class WebRTCHubx : Hub
    {

        static ConcurrentDictionary<string, string> _users = new ConcurrentDictionary<string, string>();


        public async Task Join(string userName)
        {
            if (_users.FirstOrDefault(x => x.Key == userName).Key == null)
            {
                _users.TryAdd(userName, Context.ConnectionId);

                await SendAsync(userName, new TransfferObject { Type = "login", Data = true });

            }
            else
            {
                await SendAsync(userName, new TransfferObject { Type = "login", Data = false });
            }
        }



        public async Task SendMessage(TransfferObject TransfferObject)
        {
            switch (TransfferObject.Type)
            {
                case "offer":

                    var userName = _users.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;

                    await SendAsync(TransfferObject.Name, new TransfferObject { Type = "offer", Data = TransfferObject.Data, Name = userName });

                    break;

                case "answer":
                    await SendAsync(TransfferObject.Name, new TransfferObject { Type = "answer", Data = TransfferObject.Data });

                    break;

                case "candidate":

                    await SendAsync(TransfferObject.Name, new TransfferObject { Type = "candidate", Data = TransfferObject.Data });

                    break;

                default:
                    break;
            }


        }

        public async Task SendAsync(string userName, TransfferObject TransfferObject)
        {
            string connectionId = _users[userName];

            await Clients.Client(connectionId).SendAsync("ReceiveMessage", TransfferObject);
        }
    }
}
