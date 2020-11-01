using System.Collections.Generic;

namespace WebRTC.Models
{
    public class Room
    {
        public Room()
        {
            Users = new List<string>();
        }

        public string RoomName { get; set; }
        public string HostConnectionId { get; set; }
        public IList<string> Users { get; set; }
    }
}
