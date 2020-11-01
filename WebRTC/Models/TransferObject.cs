namespace WebRTC.Models
{
    public class TransferObject
    {
        public string Sender { get; set; }

        public string Receiver { get; set; }

        public int SendType { get; set; }

        public object Data { get; set; }
    }
}
