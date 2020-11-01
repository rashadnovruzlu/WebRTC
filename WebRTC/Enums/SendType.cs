using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC.Enums
{
    public enum SendType
    {
        Offer = 1,
        Answer = 2,
        Candidate = 3,
        Leave = 4
    }
}
