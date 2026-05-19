using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using FinShield.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FinShield.Infrastructure.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly FinShieldDbContext _db;
        public TransactionRepository(FinShieldDbContext db) => _db = db;

        public async Task<IEnumerable<Transaction>> GetByUserIdAsync(int userId, int? month = null, int? year = null)
        {
            var query = _db.Transactions.Where(t => t.UserId == userId);
            if (month.HasValue) query = query.Where(t => t.Date.Month == month.Value);
            if (year.HasValue) query = query.Where(t => t.Date.Year == year.Value);
            return await query.OrderByDescending(t => t.Date).ToListAsync();
        }

        public async Task<Transaction?> GetByIdAsync(int id, int userId) =>
            await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        public async Task<IEnumerable<Transaction>> GetAllAsync(int? month = null, int? year = null)
        {
            var query = _db.Transactions.Include(t => t.User).AsQueryable();
            if (month.HasValue) query = query.Where(t => t.Date.Month == month.Value);
            if (year.HasValue) query = query.Where(t => t.Date.Year == year.Value);
            return await query.OrderByDescending(t => t.Date).ToListAsync();
        }

        public async Task<Transaction> AddAsync(Transaction transaction)
        {
            _db.Transactions.Add(transaction);
            await _db.SaveChangesAsync();
            return transaction;
        }

        public async Task<Transaction> UpdateAsync(Transaction transaction)
        {
            _db.Transactions.Update(transaction);
            await _db.SaveChangesAsync();
            return transaction;
        }

        public async Task DeleteAsync(int id, int userId)
        {
            var t = await GetByIdAsync(id, userId) ?? throw new KeyNotFoundException();
            _db.Transactions.Remove(t);
            await _db.SaveChangesAsync();
        }

        public async Task<IEnumerable<Transaction>> GetByUserIdInRangeAsync(int userId, DateTime from, DateTime to) =>
            await _db.Transactions.Where(t => t.UserId == userId && t.Date >= from && t.Date <= to).OrderBy(t => t.Date).ToListAsync();
    }
}
