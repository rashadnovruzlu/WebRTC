using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC
{
    public class TransferObject
    {
        public string Name { get; set; }
        public string Type { get; set; }
        public object Data { get; set; }
    }


    public class WebRTCHub : Hub
    {

       static ConcurrentDictionary<string, string> _users = new ConcurrentDictionary<string, string>();


        public async Task Join(string userName)
        {
            if (_users.FirstOrDefault(x => x.Key == userName).Key == null)
            {
                _users.TryAdd(userName, Context.ConnectionId);

                await SendAsync(userName, new TransferObject { Type = "login", Data = true });

            }
            else
            {
                await SendAsync(userName, new TransferObject { Type = "login", Data = false });
            }
        }



        public async Task SendMessage(TransferObject transferObject)
        {
            switch (transferObject.Type)
            {
                case "offer":
                   
                    var userName = _users.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
                    
                    await SendAsync(transferObject.Name, new TransferObject { Type = "offer", Data = transferObject.Data, Name = userName });
                    
                    break;
              
                case "answer":
                    await SendAsync(transferObject.Name, new TransferObject { Type = "answer", Data = transferObject.Data });
                   
                    break;

                case "candidate":

                    await SendAsync(transferObject.Name, new TransferObject { Type = "candidate", Data = transferObject.Data });
                  
                    break;

                default:
                    break;
            }


        }

        public async Task SendAsync(string userName, TransferObject transferObject)
        {
            string connectionId = _users[userName];

            await Clients.Client(connectionId).SendAsync("ReceiveMessage", transferObject);
        }
    }
}
