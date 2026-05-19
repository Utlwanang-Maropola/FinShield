using FinShield.Core.Entities;
using FinShield.Core.Interfaces;

namespace FinShield.Infrastructure.Services
{
    public class FraudDetectionService : IFraudDetectionService
    {
        private readonly ITransactionRepository _transactions;

        // A transaction is "large" if it exceeds 3x the user's 30-day average
        private const double LargeTransactionMultiplier = 3.0;

        // A spending spike is triggered if current month spend is 200% more than last month (same category)
        private const double SpendingSpikePercent = 2.0;

        // Velocity check window - how many minutes we look back
        private const int VelocityWindowMinutes = 10;

        // How many transactions in that window triggers the velocity rule
        private const int VelocityTransactionCount = 5;

        // Transactions between 1am and 4am are considered unusual
        private const int UnusualHourStart = 1;
        private const int UnusualHourEnd = 4;

        // Z-score threshold anything beyond 2.5 standard deviations is an outlier
        private const double ZScoreThreshold = 2.5;

        // Each rule contributes a score. Total score >= 40 means suspicious.
        private const double LargeTransactionWeight = 30;
        private const double SpendingSpikeWeight = 25;
        private const double VelocityWeight = 20;
        private const double UnusualHourWeight = 10;
        private const double ZScoreWeight = 15;

        public FraudDetectionService(ITransactionRepository transactions)
        {
            _transactions = transactions;
        }

        /// <summary>
        /// Analyses a transaction against 5 fraud rules and returns a risk score.
        /// Score >= 40 means the transaction is flagged as suspicious.
        /// </summary>
        public async Task<FraudCheckResult> AnalyzeTransactionAsync(Transaction transaction)
        {
            // We only analyse expenses, income transactions are never suspicious
            if (transaction.Type == TransactionType.Income)
                return new FraudCheckResult(false, 0, new List<string>());

            var triggeredRules = new List<string>();
            double totalScore = 0;

            // Fetch the user's last 30 days of expense transactions to use as a baseline
            // This gives us context  what is "normal" for this specific user
            var thirtyDaysAgo = transaction.Date.AddDays(-30);
            var history = (await _transactions.GetByUserIdInRangeAsync(
                transaction.UserId, thirtyDaysAgo, transaction.Date))
                .Where(t => t.Type == TransactionType.Expense && t.Id != transaction.Id)
                .ToList();

            // Rule 1: Large Transaction
            // If the transaction amount is more than 3x the user's average expense, it is suspicious.
            if (history.Any())
            {
                var avg = (double)history.Average(t => t.Amount);
                if (avg > 0 && (double)transaction.Amount > avg * LargeTransactionMultiplier)
                {
                    triggeredRules.Add($"LargeTransaction: R{transaction.Amount:N0} is {(double)transaction.Amount / avg:N1}x your 30-day average");
                    totalScore += LargeTransactionWeight;
                }

                // Rule 5: Z-Score Outlier
                // Z-score measures how many standard deviations a value is from the mean.
                // A z-score above 2.5 means the amount is statistically very unusual for this user.
                var mean = history.Average(t => (double)t.Amount);
                var variance = history.Average(t => Math.Pow((double)t.Amount - mean, 2));
                var stdDev = Math.Sqrt(variance);
                if (stdDev > 0)
                {
                    var zScore = ((double)transaction.Amount - mean) / stdDev;
                    if (zScore > ZScoreThreshold)
                    {
                        triggeredRules.Add($"ZScoreOutlier: Z-score of {zScore:N2} exceeds threshold {ZScoreThreshold}");
                        totalScore += ZScoreWeight;
                    }
                }
            }

            // Rule 2: Spending Spike
            // Compares the user's spending in the same category this month vs last month.
            // If current month is 200%+ more than last month, it is flagged.
            var currentMonthSpend = history
                .Where(t => t.Date.Month == transaction.Date.Month
                    && t.Date.Year == transaction.Date.Year
                    && t.Category == transaction.Category)
                .Sum(t => (double)t.Amount);

            // Get last month's transactions for comparison
            var previousMonthStart = new DateTime(transaction.Date.Year, transaction.Date.Month, 1).AddMonths(-1);
            var previousMonthEnd = previousMonthStart.AddMonths(1).AddDays(-1);
            var prevHistory = await _transactions.GetByUserIdInRangeAsync(
                transaction.UserId, previousMonthStart, previousMonthEnd);

            var prevMonthSpend = prevHistory
                .Where(t => t.Type == TransactionType.Expense && t.Category == transaction.Category)
                .Sum(t => (double)t.Amount);

            if (prevMonthSpend > 0 && currentMonthSpend > prevMonthSpend * SpendingSpikePercent)
            {
                var increase = ((currentMonthSpend - prevMonthSpend) / prevMonthSpend) * 100;
                triggeredRules.Add($"SpendingSpike: {transaction.Category} up {increase:N0}% vs last month");
                totalScore += SpendingSpikeWeight;
            }

            // Rule 3: High Velocity
            // Flags when too many transactions happen in a short time window.
            var windowStart = transaction.Date.AddMinutes(-VelocityWindowMinutes);
            var recentCount = history.Count(t => t.Date >= windowStart && t.Date <= transaction.Date);
            if (recentCount >= VelocityTransactionCount)
            {
                triggeredRules.Add($"HighVelocity: {recentCount + 1} transactions in {VelocityWindowMinutes} minutes");
                totalScore += VelocityWeight;
            }

            // Rule 4: Unusual Hour
            // Transactions between 1am and 4am are statistically uncommon for most users.
            var hour = transaction.Date.ToLocalTime().Hour;
            if (hour >= UnusualHourStart && hour <= UnusualHourEnd)
            {
                triggeredRules.Add($"UnusualHour: Transaction at {transaction.Date.ToLocalTime():HH:mm}");
                totalScore += UnusualHourWeight;
            }

            // A transaction is suspicious if its combined risk score is 40 or above.
            // Score is capped at 100 regardless of how many rules trigger.
            var isSuspicious = totalScore >= 40;
            return new FraudCheckResult(isSuspicious, Math.Min(totalScore, 100), triggeredRules);
        }

    }
}
