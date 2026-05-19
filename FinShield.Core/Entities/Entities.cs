using System;
using System.Collections.Generic;

namespace FinShield.Core.Entities
{
        public class AppUser
        {
            public int Id { get; set; }
            public string Email { get; set; } = string.Empty;
            public string PasswordHash { get; set; } = string.Empty;
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string Role { get; set; } = "User";
            public bool IsActive { get; set; } = true;
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
            public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
            public ICollection<FraudAlert> FraudAlerts { get; set; } = new List<FraudAlert>();
            public ICollection<Insight> Insights { get; set; } = new List<Insight>();
        }

        public class Transaction
        {
            public int Id { get; set; }
            public int UserId { get; set; }
            public decimal Amount { get; set; }
            public TransactionType Type { get; set; }
            public string Category { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string? MerchantName { get; set; }
            public string? Location { get; set; }
            public DateTime Date { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public double RiskScore { get; set; } = 0;
            public bool IsFlagged { get; set; } = false;

            public AppUser User { get; set; } = null!;
            public FraudAlert? FraudAlert { get; set; }
        }

        public class FraudAlert
        {
            public int Id { get; set; }
            public int UserId { get; set; }
            public int TransactionId { get; set; }
            public string AlertType { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public double RiskScore { get; set; }
            public AlertStatus Status { get; set; } = AlertStatus.Open;
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
            public DateTime? ResolvedAt { get; set; }
            public string? ResolvedBy { get; set; }

            public AppUser User { get; set; } = null!;
            public Transaction Transaction { get; set; } = null!;
        }

        public class Budget
        {
            public int Id { get; set; }
            public int UserId { get; set; }
            public string Category { get; set; } = string.Empty;
            public decimal MonthlyLimit { get; set; }
            public int Month { get; set; }
            public int Year { get; set; }
            public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

            public AppUser User { get; set; } = null!;
        }

        public class Insight
        {
            public int Id { get; set; }
            public int UserId { get; set; }
            public InsightType Type { get; set; }
            public string Title { get; set; } = string.Empty;
            public string Message { get; set; } = string.Empty;
            public string? Category { get; set; }
            public double? ChangePercent { get; set; }
            public InsightSeverity Severity { get; set; } = InsightSeverity.Info;
            public int Month { get; set; }
            public int Year { get; set; }
            public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

            public AppUser User { get; set; } = null!;
        }

        public enum TransactionType { Income, Expense }
        public enum AlertStatus { Open, Reviewed, Dismissed }
        public enum InsightType { SpendingIncrease, SpendingDecrease, BudgetWarning, BudgetExceeded, SavingsRate, TopCategory }
        public enum InsightSeverity { Info, Warning, Critical }
    }
