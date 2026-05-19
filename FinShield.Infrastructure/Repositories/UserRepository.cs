using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using FinShield.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FinShield.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly FinShieldDbContext _db;
        public UserRepository(FinShieldDbContext db) => _db = db;

        public async Task<AppUser?> GetByEmailAsync(string email) =>
            await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower());

        public async Task<AppUser?> GetByIdAsync(int id) => await _db.Users.FindAsync(id);

        public async Task<IEnumerable<AppUser>> GetAllAsync() => await _db.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();

        public async Task<AppUser> AddAsync(AppUser user)
        {
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return user;
        }

        public async Task<AppUser> UpdateAsync(AppUser user)
        {
            _db.Users.Update(user);
            await _db.SaveChangesAsync();
            return user;
        }

        public async Task<bool> ExistsAsync(string email) => await _db.Users.AnyAsync(u => u.Email == email.ToLower());

    }
}
