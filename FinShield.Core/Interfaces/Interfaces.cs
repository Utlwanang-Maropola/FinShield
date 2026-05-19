using FinShield.Core.Entities;

namespace FinShield.Core.Interfaces
{
    public interface IUserRepository
    {
        Task<AppUser?> GetByEmailAsync(string email);
        Task<AppUser?> GetByIdAsync(int id);
        Task<IEnumerable<AppUser>> GetAllAsync();
        Task<AppUser> AddAsync(AppUser user);
        Task<AppUser> UpdateAsync(AppUser user);
        Task<bool> ExistsAsync(string email);
    }

    public interface ITransactionRepository
    {
        Task<IEnumerable<Transaction>> GetByUserIdAsync(int userId, int? month = null, int? year = null);
        Task<Transaction?> GetByIdAsync(int id, int userId);
        Task<IEnumerable<Transaction>> GetAllAsync(int? month = null, int? year = null);
        Task<Transaction> AddAsync(Transaction transaction);
        Task<Transaction> UpdateAsync(Transaction transaction);
        Task DeleteAsync(int id, int userId);
        Task<IEnumerable<Transaction>> GetByUserIdInRangeAsync(int userId, DateTime from, DateTime to);
    }

    public interface IFraudAlertRepository
    {
        Task<IEnumerable<FraudAlert>> GetByUserIdAsync(int userId);
        Task<IEnumerable<FraudAlert>> GetAllAsync(AlertStatus? status = null);
        Task<FraudAlert?> GetByIdAsync(int id);
        Task<FraudAlert> AddAsync(FraudAlert alert);
        Task<FraudAlert> UpdateAsync(FraudAlert alert);
        Task<int> GetOpenCountByUserIdAsync(int userId);
    }

    public interface IBudgetRepository
    {
        Task<IEnumerable<Budget>> GetByUserIdAsync(int userId, int month, int year);
        Task<Budget?> GetByCategoryAsync(int userId, string category, int month, int year);
        Task<Budget?> GetByIdAsync(int id, int userId);
        Task<Budget> AddAsync(Budget budget);
        Task<Budget> UpdateAsync(Budget budget);
        Task DeleteAsync(int id, int userId);
    }

    public interface IInsightRepository
    {
        Task<IEnumerable<Insight>> GetByUserIdAsync(int userId, int month, int year);
        Task AddRangeAsync(IEnumerable<Insight> insights);
        Task DeleteByUserMonthAsync(int userId, int month, int year);
    }

    public interface IFraudDetectionService
    {
        Task<FraudCheckResult> AnalyzeTransactionAsync(Transaction transaction);
    }

    public interface IInsightsService
    {
        Task<IEnumerable<Insight>> GenerateInsightsAsync(int userId, int month, int year);
    }

    public interface IDashboardService
    {
        Task<DashboardSummary> GetSummaryAsync(int userId, int month, int year);
        Task<AdminSummary> GetAdminSummaryAsync();
    }

    public record FraudCheckResult(
        bool IsSuspicious,
        double RiskScore,
        IEnumerable<string> TriggeredRules
    );

    public record DashboardSummary(
        decimal TotalIncome,
        decimal TotalExpenses,
        decimal NetSavings,
        double SavingsRate,
        int OpenFraudAlerts,
        IEnumerable<CategorySpend> SpendingByCategory,
        IEnumerable<MonthlyTrend> MonthlyTrends,
        IEnumerable<BudgetStatus> BudgetStatuses
    );

    public record AdminSummary(
        int TotalUsers,
        int TotalTransactions,
        int OpenAlerts,
        decimal TotalTransactionVolume,
        IEnumerable<RecentAlert> RecentAlerts
    );

    public record CategorySpend(string Category, decimal Amount, double Percentage);
    public record MonthlyTrend(string Month, decimal Income, decimal Expenses);
    public record BudgetStatus(string Category, decimal Limit, decimal Spent, bool IsOverBudget, double PercentUsed);
    public record RecentAlert(int Id, string UserEmail, string AlertType, double RiskScore, DateTime CreatedAt);
}