using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using FinShield.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class InsightRepository : IInsightRepository
{
    private readonly FinShieldDbContext _db;
    public InsightRepository(FinShieldDbContext db) => _db = db;

    public async Task<IEnumerable<Insight>> GetByUserIdAsync(int userId, int month, int year) =>
        await _db.Insights.Where(i => i.UserId == userId && i.Month == month && i.Year == year)
        .OrderByDescending(i => i.Severity).ToListAsync();

    public async Task AddRangeAsync(IEnumerable<Insight> insights)
    {
        _db.Insights.AddRange(insights);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteByUserMonthAsync(int userId, int month, int year)
    {
        var existing = await _db.Insights.Where(i => i.UserId == userId && i.Month == month && i.Year == year).ToListAsync();
        _db.Insights.RemoveRange(existing);
        await _db.SaveChangesAsync();
    }
}