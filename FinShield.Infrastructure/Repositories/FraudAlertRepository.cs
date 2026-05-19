using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using FinShield.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class FraudAlertRepository : IFraudAlertRepository
{
    private readonly FinShieldDbContext _db;
    public FraudAlertRepository(FinShieldDbContext db) => _db = db;

    public async Task<IEnumerable<FraudAlert>> GetByUserIdAsync(int userId) =>
        await _db.FraudAlerts.Include(a => a.Transaction).Where(a => a.UserId == userId)
        .OrderByDescending(a => a.CreatedAt).ToListAsync();

    public async Task<IEnumerable<FraudAlert>> GetAllAsync(AlertStatus? status = null)
    {
        var query = _db.FraudAlerts.Include(a => a.User).Include(a => a.Transaction).AsQueryable();
        if (status.HasValue) query = query.Where(a => a.Status == status.Value);
        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<FraudAlert?> GetByIdAsync(int id) =>
        await _db.FraudAlerts.Include(a => a.Transaction).Include(a => a.User).FirstOrDefaultAsync(a => a.Id == id);

    public async Task<FraudAlert> AddAsync(FraudAlert alert)
    {
        _db.FraudAlerts.Add(alert);
        await _db.SaveChangesAsync();
        return alert;
    }

    public async Task<FraudAlert> UpdateAsync(FraudAlert alert)
    {
        _db.FraudAlerts.Update(alert);
        await _db.SaveChangesAsync();
        return alert;
    }

    public async Task<int> GetOpenCountByUserIdAsync(int userId) =>
        await _db.FraudAlerts.CountAsync(a => a.UserId == userId && a.Status == AlertStatus.Open);
}