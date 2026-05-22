using FinShield.API.DTOs;
using FinShield.Core.Entities;
using FinShield.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinShield.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")] // Only users with the Admin role can access any endpoint in this controller
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository _users;
        private readonly IFraudAlertRepository _alerts;
        private readonly IDashboardService _dashboard;

        public AdminController(
            IUserRepository users,
            IFraudAlertRepository alerts,
            IDashboardService dashboard)
        {
            _users = users;
            _alerts = alerts;
            _dashboard = dashboard;
        }

        /// <summary>
        /// Returns system-wide stats for the admin dashboard.
        /// Includes total users, transactions, open alerts and transaction volume.
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var summary = await _dashboard.GetAdminSummaryAsync();
            return Ok(summary);
        }

        /// <summary>
        /// Returns a list of all registered users.
        /// Admin can use this to monitor accounts and take action on suspicious ones.
        /// </summary>
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserAdminResponse>>> GetUsers()
        {
            var users = await _users.GetAllAsync();
            return Ok(users.Select(u => new UserAdminResponse(
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Role,
                u.IsActive,
                u.CreatedAt
            )));
        }

        /// <summary>
        /// Activates or suspends a user account.
        /// Suspended users cannot log in until reactivated.
        /// </summary>
        [HttpPatch("users/{id}/toggle")]
        public async Task<IActionResult> ToggleUser(int id, ToggleUserRequest req)
        {
            var user = await _users.GetByIdAsync(id);
            if (user is null) return NotFound();

            user.IsActive = req.IsActive;
            await _users.UpdateAsync(user);
            return NoContent();
        }

        /// <summary>
        /// Returns all fraud alerts across all users.
        /// Optionally filtered by status - Open, Reviewed or Dismissed.
        /// Admin can monitor all suspicious activity system-wide.
        /// </summary>
        [HttpGet("alerts")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllAlerts(
            [FromQuery] string? status)
        {
            // Parse the status filter if provided
            AlertStatus? alertStatus = null;
            if (status is not null && Enum.TryParse<AlertStatus>(status, out var parsed))
                alertStatus = parsed;

            var alerts = await _alerts.GetAllAsync(alertStatus);

            // Return an anonymous object with just the fields the admin needs
            // We include user email and transaction details for context
            return Ok(alerts.Select(a => new
            {
                a.Id,
                a.AlertType,
                a.Description,
                a.RiskScore,
                Status = a.Status.ToString(),
                a.CreatedAt,
                User = new { a.User.Email, a.User.FirstName },
                Transaction = new
                {
                    a.Transaction.Amount,
                    a.Transaction.Category,
                    a.Transaction.Date
                }
            }));
        }

        /// <summary>
        /// Allows admin to resolve any fraud alert in the system.
        /// Useful for clearing false positives or confirming fraud on behalf of a user.
        /// </summary>
        [HttpPatch("alerts/{id}/resolve")]
        public async Task<IActionResult> ResolveAlert(int id, ResolveAlertRequest req)
        {
            var alert = await _alerts.GetByIdAsync(id);
            if (alert is null) return NotFound();

            if (!Enum.TryParse<AlertStatus>(req.Action, out var status))
                return BadRequest("Use 'Reviewed' or 'Dismissed'.");

            alert.Status = status;
            alert.ResolvedAt = DateTime.UtcNow;
            alert.ResolvedBy = User.FindFirstValue(ClaimTypes.Email);

            await _alerts.UpdateAsync(alert);
            return NoContent();
        }
    }
}