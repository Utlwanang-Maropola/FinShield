using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using FinShield.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

public class BudgetRepository : IBudgetRepository
{
    private readonly FinShieldDbContext _db;
    public BudgetRepository(FinShieldDbContext db) => _db = db;

    public async Task<IEnumerable<Budget>> GetByUserIdAsync(int userId, int month, int year) =>
        await _db.Budgets.Where(b => b.UserId == userId && b.Month == month && b.Year == year).ToListAsync();

    public async Task<Budget?> GetByCategoryAsync(int userId, string category, int month, int year) =>
        await _db.Budgets.FirstOrDefaultAsync(b =>
        b.UserId == userId && b.Category == category && b.Month == month && b.Year == year);

    public async Task<Budget?> GetByIdAsync(int id, int userId) =>
        await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);

    public async Task<Budget> AddAsync(Budget budget)
    {
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();
        return budget;
    }

    public async Task<Budget> UpdateAsync(Budget budget)
    {
        _db.Budgets.Update(budget);
        await _db.SaveChangesAsync();
        return budget;
    }

    public async Task DeleteAsync(int id, int userId)
    {
        var b = await GetByIdAsync(id, userId) ?? throw new KeyNotFoundException();
        _db.Budgets.Remove(b);
        await _db.SaveChangesAsync();
    }
}