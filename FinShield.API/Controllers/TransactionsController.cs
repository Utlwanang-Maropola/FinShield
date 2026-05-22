using FinShield.API.DTOs;
using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Security.Claims;

namespace FinShield.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All endpoints require a valid JWT token
    public class TransactionsController : ControllerBase
    {
        private readonly ITransactionRepository _repo;
        private readonly IFraudAlertRepository _fraudAlerts;
        private readonly IFraudDetectionService _fraudDetection;

        // Helper property to get the logged in user's ID from the JWT token
        // ClaimTypes.NameIdentifier maps to the user ID we set when generating the token
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public TransactionsController(
            ITransactionRepository repo,
            IFraudAlertRepository fraudAlerts,
            IFraudDetectionService fraudDetection)
        {
            _repo = repo;
            _fraudAlerts = fraudAlerts;
            _fraudDetection = fraudDetection;
        }

        /// <summary>
        /// Returns all transactions for the logged in user.
        /// Optionally filtered by month and year for the dashboard.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TransactionResponse>>> GetAll(
            [FromQuery] int? month, [FromQuery] int? year)
        {
            var transactions = await _repo.GetByUserIdAsync(UserId, month, year);
            return Ok(transactions.Select(Map));
        }

        /// <summary>
        /// Returns a single transaction by ID.
        /// Only returns it if it belongs to the logged in user - prevents users
        /// from accessing each other's transactions.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<TransactionResponse>> GetById(int id)
        {
            var transaction = await _repo.GetByIdAsync(id, UserId);
            return transaction is null ? NotFound() : Ok(Map(transaction));
        }

        /// <summary>
        /// Creates a new transaction and immediately runs fraud detection on it.
        /// If the fraud engine flags it, a FraudAlert is automatically created.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TransactionResponse>> Create(TransactionRequest req)
        {
            if (!Enum.TryParse<TransactionType>(req.Type, out var type))
                return BadRequest("Invalid type. Use 'Income' or 'Expense'.");

            var transaction = await _repo.AddAsync(new Transaction
            {
                UserId = UserId,
                Amount = req.Amount,
                Type = type,
                Category = req.Category,
                Description = req.Description ?? string.Empty,
                MerchantName = req.MerchantName,
                Location = req.Location,
                Date = req.Date
            });

            // Run fraud detection on every new expense transaction
            // This happens automatically - the user does not need to trigger it
            var result = await _fraudDetection.AnalyzeTransactionAsync(transaction);
            if (result.IsSuspicious)
            {
                // Update the transaction with its risk score and flag it
                transaction.RiskScore = result.RiskScore;
                transaction.IsFlagged = true;
                await _repo.UpdateAsync(transaction);

                // Create a fraud alert so it appears in the alerts dashboard
                await _fraudAlerts.AddAsync(new FraudAlert
                {
                    UserId = UserId,
                    TransactionId = transaction.Id,
                    // Join all triggered rule names into one string
                    AlertType = string.Join(", ", result.TriggeredRules.Select(r => r.Split(':')[0])),
                    // Full descriptions of all triggered rules
                    Description = string.Join(" | ", result.TriggeredRules),
                    RiskScore = result.RiskScore
                });
            }

            return CreatedAtAction(nameof(GetById), new { id = transaction.Id }, Map(transaction));
        }

        /// <summary>
        /// Updates an existing transaction.
        /// Only the owner of the transaction can update it.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<TransactionResponse>> Update(int id, TransactionRequest req)
        {
            var transaction = await _repo.GetByIdAsync(id, UserId);
            if (transaction is null) return NotFound();

            if (!Enum.TryParse<TransactionType>(req.Type, out var type))
                return BadRequest("Invalid type.");

            transaction.Amount = req.Amount;
            transaction.Type = type;
            transaction.Category = req.Category;
            transaction.Description = req.Description ?? string.Empty;
            transaction.MerchantName = req.MerchantName;
            transaction.Location = req.Location;
            transaction.Date = req.Date;

            return Ok(Map(await _repo.UpdateAsync(transaction)));
        }

        /// <summary>
        /// Deletes a transaction.
        /// Only the owner can delete their own transactions.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _repo.DeleteAsync(id, UserId);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        /// <summary>
        /// Bulk imports transactions from a CSV file.
        /// Expected CSV format: Date (yyyy-MM-dd), Amount, Type, Category, Description, MerchantName
        /// Fraud detection runs on each imported transaction automatically.
        /// </summary>
        [HttpPost("import/csv")]
        public async Task<ActionResult<CsvImportResult>> ImportCsv(IFormFile file)
        {
            if (file is null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var imported = 0;
            var skipped = 0;
            var errors = new List<string>();

            using var reader = new StreamReader(file.OpenReadStream());

            // Skip the header row
            await reader.ReadLineAsync();

            var line = string.Empty;
            var lineNumber = 1;

            while ((line = await reader.ReadLineAsync()) is not null)
            {
                lineNumber++;
                var cols = line.Split(',');

                if (cols.Length < 4)
                {
                    errors.Add($"Line {lineNumber}: too few columns");
                    skipped++;
                    continue;
                }

                try
                {
                    // Parse and validate each column
                    if (!DateTime.TryParseExact(cols[0].Trim(), "yyyy-MM-dd",
                        CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                        throw new FormatException("Date must be yyyy-MM-dd");

                    if (!decimal.TryParse(cols[1].Trim(), out var amount) || amount <= 0)
                        throw new FormatException("Amount must be a positive number");

                    if (!Enum.TryParse<TransactionType>(cols[2].Trim(), out var type))
                        throw new FormatException("Type must be 'Income' or 'Expense'");

                    var transaction = await _repo.AddAsync(new Transaction
                    {
                        UserId = UserId,
                        Date = date,
                        Amount = amount,
                        Type = type,
                        Category = cols[3].Trim(),
                        Description = cols.Length > 4 ? cols[4].Trim() : string.Empty,
                        MerchantName = cols.Length > 5 ? cols[5].Trim() : null
                    });

                    // Run fraud detection on imported transactions too
                    var result = await _fraudDetection.AnalyzeTransactionAsync(transaction);
                    if (result.IsSuspicious)
                    {
                        transaction.RiskScore = result.RiskScore;
                        transaction.IsFlagged = true;
                        await _repo.UpdateAsync(transaction);

                        await _fraudAlerts.AddAsync(new FraudAlert
                        {
                            UserId = UserId,
                            TransactionId = transaction.Id,
                            AlertType = string.Join(", ", result.TriggeredRules.Select(r => r.Split(':')[0])),
                            Description = string.Join(" | ", result.TriggeredRules),
                            RiskScore = result.RiskScore
                        });
                    }

                    imported++;
                }
                catch (Exception ex)
                {
                    errors.Add($"Line {lineNumber}: {ex.Message}");
                    skipped++;
                }
            }

            return Ok(new CsvImportResult(imported, skipped, errors));
        }

        // Maps a Transaction entity to a TransactionResponse DTO
        // We never return raw entities from the API - always map to DTOs
        private static TransactionResponse Map(Transaction t) =>
            new(t.Id, t.Amount, t.Type.ToString(), t.Category, t.Description,
                t.MerchantName, t.Location, t.Date, t.RiskScore, t.IsFlagged);
    }
}