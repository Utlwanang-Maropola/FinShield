using FinShield.Core.Entities;
using FinShield.Core.Interfaces;

namespace FinShield.Core.Services
{
    public class InsightsService : IInsightsService
    {
        private readonly ITransactionRepository _transactions;
        private readonly IBudgetRepository _budgets;

        public InsightsService(ITransactionRepository transactions, IBudgetRepository budgets)
        {
            _transactions = transactions;
            _budgets = budgets;
        }

        /// <summary>
        /// Generates natural language financial insights for a user for a given month.
        /// Compares current month spending against the previous month to identify trends.
        /// No external AI API needed - all logic is rule-based.
        /// </summary>
        public async Task<IEnumerable<Insight>> GenerateInsightsAsync(int userId, int month, int year)
        {
            var insights = new List<Insight>();

            // Get current month expenses
            var currentTxns = (await _transactions.GetByUserIdAsync(userId, month, year))
                .Where(t => t.Type == TransactionType.Expense)
                .ToList();

            // Get previous month expenses for comparison
            // Handle January edge case - previous month is December of previous year
            var prevMonth = month == 1 ? 12 : month - 1;
            var prevYear = month == 1 ? year - 1 : year;
            var prevTxns = (await _transactions.GetByUserIdAsync(userId, prevMonth, prevYear))
                .Where(t => t.Type == TransactionType.Expense)
                .ToList();

            // Get all transactions (income + expenses) to calculate savings rate
            var allTxns = (await _transactions.GetByUserIdAsync(userId, month, year)).ToList();
            var totalIncome = allTxns.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var totalExpenses = currentTxns.Sum(t => t.Amount);

            // Get budgets for the current month to check for overspending
            var budgets = (await _budgets.GetByUserIdAsync(userId, month, year)).ToList();

            // --- Insight 1: Category Spend Changes ---
            // Group current and previous month spending by category
            // Then compare each category to find significant increases or decreases
            var currentByCategory = currentTxns
                .GroupBy(t => t.Category)
                .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount));

            var prevByCategory = prevTxns
                .GroupBy(t => t.Category)
                .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount));

            foreach (var category in currentByCategory.Keys)
            {
                // Skip categories that have no previous month data - can't calculate a change
                if (!prevByCategory.TryGetValue(category, out var prevAmount) || prevAmount == 0)
                    continue;

                var currentAmount = currentByCategory[category];

                // Calculate percentage change: (current - previous) / previous * 100
                var changePercent = ((double)(currentAmount - prevAmount) / (double)prevAmount) * 100;

                // Only surface changes of 15% or more - smaller changes are not meaningful
                if (Math.Abs(changePercent) >= 15)
                {
                    var increased = changePercent > 0;

                    insights.Add(new Insight
                    {
                        UserId = userId,
                        Type = increased ? InsightType.SpendingIncrease : InsightType.SpendingDecrease,
                        Title = increased ? $"{category} spending is up" : $"{category} spending is down",

                        // Generate a human-readable message explaining the change
                        Message = increased
                            ? $"Your {category} spending increased by {Math.Abs(changePercent):N0}% compared to last month " +
                              $"(R{prevAmount:N0} → R{currentAmount:N0}). Consider reviewing if this aligns with your budget."
                            : $"Great news — your {category} spending dropped by {Math.Abs(changePercent):N0}% vs last month " +
                              $"(R{prevAmount:N0} → R{currentAmount:N0}).",

                        Category = category,
                        ChangePercent = changePercent,

                        // Large increases (50%+) are warnings, smaller changes are just info
                        Severity = changePercent > 50 ? InsightSeverity.Warning : InsightSeverity.Info,
                        Month = month,
                        Year = year
                    });
                }
            }

            // --- Insight 2: Budget Warnings ---
            // Check each budget to see if the user is close to or over their limit
            foreach (var budget in budgets)
            {
                var spent = currentByCategory.GetValueOrDefault(budget.Category, 0);
                var percentUsed = budget.MonthlyLimit > 0
                    ? (double)spent / (double)budget.MonthlyLimit * 100
                    : 0;

                if (spent > budget.MonthlyLimit)
                {
                    // Budget exceeded - critical alert
                    insights.Add(new Insight
                    {
                        UserId = userId,
                        Type = InsightType.BudgetExceeded,
                        Title = $"{budget.Category} budget exceeded",
                        Message = $"You've spent R{spent:N0} on {budget.Category} this month, " +
                                  $"exceeding your R{budget.MonthlyLimit:N0} budget by " +
                                  $"R{spent - budget.MonthlyLimit:N0} ({percentUsed:N0}% of limit).",
                        Category = budget.Category,
                        ChangePercent = percentUsed,
                        Severity = InsightSeverity.Critical,
                        Month = month,
                        Year = year
                    });
                }
                else if (percentUsed >= 80)
                {
                    // Approaching budget limit - warning
                    insights.Add(new Insight
                    {
                        UserId = userId,
                        Type = InsightType.BudgetWarning,
                        Title = $"{budget.Category} budget at {percentUsed:N0}%",
                        Message = $"You've used {percentUsed:N0}% of your {budget.Category} budget " +
                                  $"(R{spent:N0} of R{budget.MonthlyLimit:N0}). " +
                                  $"You have R{budget.MonthlyLimit - spent:N0} remaining for the rest of the month.",
                        Category = budget.Category,
                        ChangePercent = percentUsed,
                        Severity = InsightSeverity.Warning,
                        Month = month,
                        Year = year
                    });
                }
            }

            // --- Insight 3: Savings Rate ---
            // Savings rate = (income - expenses) / income * 100
            // Financial best practice is to save at least 20% of income
            if (totalIncome > 0)
            {
                var savingsRate = (double)(totalIncome - totalExpenses) / (double)totalIncome * 100;

                var message = savingsRate >= 20
                    ? $"You're saving {savingsRate:N0}% of your income this month — excellent financial health."
                    : savingsRate >= 10
                        ? $"Your savings rate is {savingsRate:N0}% this month. Aim for 20%+ for long-term financial health."
                        : $"Your savings rate is only {savingsRate:N0}% this month. Your expenses are consuming most of your income.";

                insights.Add(new Insight
                {
                    UserId = userId,
                    Type = InsightType.SavingsRate,
                    Title = $"Savings rate: {savingsRate:N0}%",
                    Message = message,
                    Severity = savingsRate >= 20
                        ? InsightSeverity.Info
                        : savingsRate >= 10
                            ? InsightSeverity.Warning
                            : InsightSeverity.Critical,
                    Month = month,
                    Year = year
                });
            }

            // --- Insight 4: Top Spending Category ---
            // Identifies the category where the user spent the most this month
            // Useful for awareness - people are often surprised by their top spend category
            if (currentByCategory.Any())
            {
                var top = currentByCategory.OrderByDescending(k => k.Value).First();
                var topPercent = totalExpenses > 0
                    ? (double)top.Value / (double)totalExpenses * 100
                    : 0;

                insights.Add(new Insight
                {
                    UserId = userId,
                    Type = InsightType.TopCategory,
                    Title = $"Top spend: {top.Key}",
                    Message = $"{top.Key} is your highest spend category this month at R{top.Value:N0}, " +
                              $"accounting for {topPercent:N0}% of your total expenses.",
                    Category = top.Key,
                    Severity = InsightSeverity.Info,
                    Month = month,
                    Year = year
                });
            }

            return insights;
        }
    }
}