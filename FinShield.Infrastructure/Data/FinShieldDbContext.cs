using FinShield.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FinShield.Infrastructure.Data
{
    public class FinShieldDbContext : DbContext
    {
        public FinShieldDbContext(DbContextOptions<FinShieldDbContext> options) : base(options) { }

        public DbSet<AppUser> Users => Set<AppUser>();
        public DbSet<Transaction> Transactions => Set<Transaction>();
        public DbSet<FraudAlert> FraudAlerts => Set<FraudAlert>();
        public DbSet<Budget> Budgets => Set<Budget>();
        public DbSet<Insight> Insights => Set<Insight>();

        protected override void OnModelCreating(ModelBuilder m)
        {
            m.Entity<AppUser>(e =>
            {
                e.HasKey(u => u.Id);
                e.HasIndex(u => u.Email).IsUnique();
                e.Property(u => u.Email).IsRequired().HasMaxLength(256);
                e.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
                e.Property(u => u.LastName).IsRequired().HasMaxLength(100);
                e.Property(u => u.Role).IsRequired().HasMaxLength(20);
            });

            m.Entity<Transaction>(e =>
            {
                e.HasKey(t => t.Id);
                e.Property(t => t.Amount).HasPrecision(18, 2);
                e.Property(t => t.Category).IsRequired().HasMaxLength(100);
                e.Property(t => t.Description).HasMaxLength(500);
                e.Property(t => t.MerchantName).HasMaxLength(200);
                e.Property(t => t.Location).HasMaxLength(200);
                e.HasOne(t => t.User)
                 .WithMany(u => u.Transactions)
                 .HasForeignKey(t => t.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            m.Entity<FraudAlert>(e =>
            {
                e.HasKey(a => a.Id);
                e.Property(a => a.AlertType).IsRequired().HasMaxLength(100);
                e.Property(a => a.Description).HasMaxLength(1000);
                e.HasOne(a => a.User)
                 .WithMany(u => u.FraudAlerts)
                 .HasForeignKey(a => a.UserId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(a => a.Transaction)
                 .WithOne(t => t.FraudAlert)
                 .HasForeignKey<FraudAlert>(a => a.TransactionId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            m.Entity<Budget>(e =>
            {
                e.HasKey(b => b.Id);
                e.Property(b => b.MonthlyLimit).HasPrecision(18, 2);
                e.Property(b => b.Category).IsRequired().HasMaxLength(100);
                e.HasOne(b => b.User)
                 .WithMany(u => u.Budgets)
                 .HasForeignKey(b => b.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(b => new { b.UserId, b.Category, b.Month, b.Year }).IsUnique();
            });

            m.Entity<Insight>(e =>
            {
                e.HasKey(i => i.Id);
                e.Property(i => i.Title).IsRequired().HasMaxLength(200);
                e.Property(i => i.Message).IsRequired().HasMaxLength(2000);
                e.HasOne(i => i.User)
                 .WithMany(u => u.Insights)
                 .HasForeignKey(i => i.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}