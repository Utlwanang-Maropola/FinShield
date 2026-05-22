using System.ComponentModel.DataAnnotations;

namespace FinShield.API.DTOs
{
    // --- Auth ---

    public record RegisterRequest(
        [Required, EmailAddress] string Email,
        [Required, MinLength(8)] string Password,
        [Required, MaxLength(100)] string FirstName,
        [Required, MaxLength(100)] string LastName
    );

    public record LoginRequest(
        [Required, EmailAddress] string Email,
        [Required] string Password
    );

    public record AuthResponse(
        string Token,
        string Email,
        string FirstName,
        string Role
    );

    // --- Transactions ---

    public record TransactionRequest(
        [Required, Range(0.01, double.MaxValue)] decimal Amount,
        [Required] string Type,
        [Required, MaxLength(100)] string Category,
        [MaxLength(500)] string? Description,
        [MaxLength(200)] string? MerchantName,
        [MaxLength(200)] string? Location,
        [Required] DateTime Date
    );

    public record TransactionResponse(
        int Id,
        decimal Amount,
        string Type,
        string Category,
        string? Description,
        string? MerchantName,
        string? Location,
        DateTime Date,
        double RiskScore,
        bool IsFlagged
    );

    // --- CSV Import ---

    public record CsvImportResult(
        int Imported,
        int Skipped,
        IEnumerable<string> Errors
    );

    // --- Fraud ---

    public record FraudAlertResponse(
        int Id,
        int TransactionId,
        string AlertType,
        string Description,
        double RiskScore,
        string Status,
        DateTime CreatedAt,
        TransactionResponse Transaction
    );

    public record ResolveAlertRequest(
        [Required] string Action // "Reviewed" or "Dismissed"
    );

    // --- Budgets ---

    public record BudgetRequest(
        [Required, MaxLength(100)] string Category,
        [Required, Range(0.01, double.MaxValue)] decimal MonthlyLimit,
        [Required, Range(1, 12)] int Month,
        [Required, Range(2020, 2100)] int Year
    );

    public record BudgetResponse(
        int Id,
        string Category,
        decimal MonthlyLimit,
        int Month,
        int Year
    );

    // --- Insights ---

    public record InsightResponse(
        int Id,
        string Type,
        string Title,
        string Message,
        string? Category,
        double? ChangePercent,
        string Severity,
        DateTime GeneratedAt
    );

    // --- Admin ---

    public record UserAdminResponse(
        int Id,
        string Email,
        string FirstName,
        string LastName,
        string Role,
        bool IsActive,
        DateTime CreatedAt
    );

    public record ToggleUserRequest(
        [Required] bool IsActive
    );
}