using FinShield.API.DTOs;
using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinShield.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FraudController : ControllerBase
    {
        private readonly IFraudAlertRepository _repo;

        // Gets the logged in user's ID from the JWT token claims
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public FraudController(IFraudAlertRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// Returns all fraud alerts for the logged in user.
        /// Includes the full transaction details so the user can see
        /// exactly which transaction triggered the alert.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FraudAlertResponse>>> GetMyAlerts()
        {
            var alerts = await _repo.GetByUserIdAsync(UserId);
            return Ok(alerts.Select(Map));
        }

        /// <summary>
        /// Allows the user to resolve an alert by marking it as
        /// Reviewed (legitimate transaction) or Dismissed (false positive).
        /// Only the owner of the alert can resolve it.
        /// </summary>
        [HttpPatch("{id}/resolve")]
        public async Task<ActionResult<FraudAlertResponse>> Resolve(int id, ResolveAlertRequest req)
        {
            var alert = await _repo.GetByIdAsync(id);

            // Make sure the alert exists and belongs to the logged in user
            if (alert is null || alert.UserId != UserId)
                return NotFound();

            if (!Enum.TryParse<AlertStatus>(req.Action, out var status))
                return BadRequest("Use 'Reviewed' or 'Dismissed'.");

            // Record when and who resolved the alert
            alert.Status = status;
            alert.ResolvedAt = DateTime.UtcNow;
            alert.ResolvedBy = User.FindFirstValue(ClaimTypes.Email);

            return Ok(Map(await _repo.UpdateAsync(alert)));
        }

        // Maps a FraudAlert entity to a FraudAlertResponse DTO
        // Also maps the nested Transaction so the frontend has all the info it needs
        private static FraudAlertResponse Map(FraudAlert a) =>
            new(
                a.Id,
                a.TransactionId,
                a.AlertType,
                a.Description,
                a.RiskScore,
                a.Status.ToString(),
                a.CreatedAt,
                new TransactionResponse(
                    a.Transaction.Id,
                    a.Transaction.Amount,
                    a.Transaction.Type.ToString(),
                    a.Transaction.Category,
                    a.Transaction.Description,
                    a.Transaction.MerchantName,
                    a.Transaction.Location,
                    a.Transaction.Date,
                    a.Transaction.RiskScore,
                    a.Transaction.IsFlagged
                )
            );
    }
}