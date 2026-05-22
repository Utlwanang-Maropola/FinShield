using FinShield.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinShield.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboard;

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public DashboardController(IDashboardService dashboard)
        {
            _dashboard = dashboard;
        }

        /// <summary>
        /// Returns a full dashboard summary for the logged in user.
        /// Includes income, expenses, savings rate, spending by category,
        /// budget statuses, monthly trends and open fraud alert count.
        /// Defaults to current month if no month/year provided.
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(
            [FromQuery] int? month,
            [FromQuery] int? year)
        {
            var m = month ?? DateTime.UtcNow.Month;
            var y = year ?? DateTime.UtcNow.Year;

            var summary = await _dashboard.GetSummaryAsync(UserId, m, y);
            return Ok(summary);
        }
    }
}