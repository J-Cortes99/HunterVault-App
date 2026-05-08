using HunterVault.Application.Abstractions.Time;

namespace HunterVault.Infrastructure.Common;

public class SystemClock : IClock
{
    public DateTime UtcNow => DateTime.UtcNow;
}
