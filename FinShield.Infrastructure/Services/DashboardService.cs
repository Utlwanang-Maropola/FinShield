using FinShield.Core.Entities;
using FinShield.Core.Interfaces;

namespace FinShield.Core.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly ITransactionRepository _transactions;
        private readonly IBudgetRepository _budgets;
        private readonly IFraudAlertRepository _fraudAlerts;
        private readonly IUserRepository _users;

        public DashboardService(
            ITransactionRepository transactions,
            IBudgetRepository budgets,
            IFraudAlertRepository fraudAlerts,
            IUserRepository users)
        {
            _transactions = transactions;
            _budgets = budgets;
            _fraudAlerts = fraudAlerts;
            _users = users;
        }

        /// <summary>
        /// Returns a full dashboard summary for a specific user and month.
        /// Includes income, expenses, savings rate, budget statuses,
        /// spending by category, and 6 months of trend data.
        /// </summary>
        public async Task<DashboardSummary> GetSummaryAsync(int userId, int month, int year)
        {
            // Get all transactions for the requested month
            var txns = (await _transactions.GetByUserIdAsync(userId, month, year)).ToList();

            // Get budgets set by the user for this month
            var budgets = (await _budgets.GetByUserIdAsync(userId, month, year)).ToList();

            // Get count of open fraud alerts so the dashboard can show a warning badge
            var openAlerts = await _fraudAlerts.GetOpenCountByUserIdAsync(userId);

            // Split transactions into income and expenses for calculations
            var income = txns.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var expenses = txns.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

            // Savings rate: what percentage of income was saved
            // Formula: (income - expenses) / income * 100
            var savingsRate = income > 0
                ? (double)(income - expenses) / (double)income * 100
                : 0;

            // Group expenses by category and calculate each category's
            // percentage of total spending for the pie chart
            var spendingByCategory = txns
                .Where(t => t.Type == TransactionType.Expense)
                .GroupBy(t => t.Category)
                .Select(g => new CategorySpend(
                    g.Key,
                    g.Sum(t => t.Amount),
                    expenses > 0 ? (double)g.Sum(t => t.Amount) / (double)expenses * 100 : 0
                ))
                .OrderByDescending(c => c.Amount);

            // Get 6 months of trend data for the line chart
            var monthlyTrends = await GetMonthlyTrendsAsync(userId, month, year, 6);

            // For each budget, calculate how much has been spent in that category
            // and whether the user is over budget
            var budgetStatuses = budgets.Select(b =>
            {
                var spent = txns
                    .Where(t => t.Type == TransactionType.Expense && t.Category == b.Category)
                    .Sum(t => t.Amount);

                var percentUsed = b.MonthlyLimit > 0
                    ? (double)spent / (double)b.MonthlyLimit * 100
                    : 0;

                return new BudgetStatus(
                    b.Category,
                    b.MonthlyLimit,
                    spent,
                    spent > b.MonthlyLimit,
                    percentUsed
                );
            });

            return new DashboardSummary(
                income,
                expenses,
                income - expenses,
                savingsRate,
                openAlerts,
                spendingByCategory,
                monthlyTrends,
                budgetStatuses
            );
        }

        /// <summary>
        /// Returns system-wide stats for the admin dashboard.
        /// Only accessible to users with the Admin role.
        /// </summary>
        public async Task<AdminSummary> GetAdminSummaryAsync()
        {
            var users = await _users.GetAllAsync();
            var allTxns = await _transactions.GetAllAsync();
            var openAlerts = (await _fraudAlerts.GetAllAsync(AlertStatus.Open)).ToList();

            // Get the 10 most recent open alerts to show in the admin dashboard
            var recentAlerts = openAlerts
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new RecentAlert(
                    a.Id,
                    a.User.Email,
                    a.AlertType,
                    a.RiskScore,
                    a.CreatedAt
                ));

            return new AdminSummary(
                users.Count(),
                allTxns.Count(),
                openAlerts.Count,
                allTxns.Sum(t => t.Amount),
                recentAlerts
            );
        }

        /// <summary>
        /// Builds a list of monthly income vs expense totals going back N months.
        /// Used to populate the trend chart on the dashboard.
        /// </summary>
        private async Task<IEnumerable<MonthlyTrend>> GetMonthlyTrendsAsync(
            int userId, int month, int year, int months)
        {
            var trends = new List<MonthlyTrend>();

            // Start from the current month and go back N months
            var date = new DateTime(year, month, 1);

            for (int i = months - 1; i >= 0; i--)
            {
                // Calculate which month we are looking at
                var target = date.AddMonths(-i);

                var txns = (await _transactions.GetByUserIdAsync(
                    userId, target.Month, target.Year)).ToList();

                trends.Add(new MonthlyTrend(
                    target.ToString("MMM yyyy"),
                    txns.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                    txns.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)
                ));
            }

            return trends;
        }
    }
}