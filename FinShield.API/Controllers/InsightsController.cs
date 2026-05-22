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
    public class InsightsController : ControllerBase
    {
        private readonly IInsightsService _insightsService;
        private readonly IInsightRepository _repo;

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public InsightsController(IInsightsService insightsService, IInsightRepository repo)
        {
            _insightsService = insightsService;
            _repo = repo;
        }

        /// <summary>
        /// Returns saved insights for the logged in user for a given month.
        /// If no month/year is provided it defaults to the current month.
        /// Insights are pre-generated and stored - this just fetches them.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InsightResponse>>> Get(
            [FromQuery] int? month, [FromQuery] int? year)
        {
            var m = month ?? DateTime.UtcNow.Month;
            var y = year ?? DateTime.UtcNow.Year;

            var insights = await _repo.GetByUserIdAsync(UserId, m, y);
            return Ok(insights.Select(Map));
        }

        /// <summary>
        /// Regenerates insights for the logged in user for a given month.
        /// Deletes any existing insights for that month first to avoid duplicates.
        /// Then runs the InsightsService which analyses spending patterns
        /// and generates natural language summaries.
        /// </summary>
        [HttpPost("generate")]
        public async Task<ActionResult<IEnumerable<InsightResponse>>> Generate(
            [FromQuery] int? month, [FromQuery] int? year)
        {
            var m = month ?? DateTime.UtcNow.Month;
            var y = year ?? DateTime.UtcNow.Year;

            // Delete existing insights for this month before regenerating
            // so we don't end up with duplicate insights
            await _repo.DeleteByUserMonthAsync(UserId, m, y);

            // Run the insights engine - analyses transactions and generates insights
            var insights = (await _insightsService.GenerateInsightsAsync(UserId, m, y)).ToList();

            // Make sure each insight is linked to the correct user
            insights.ForEach(i => i.UserId = UserId);

            // Save the generated insights to the database
            await _repo.AddRangeAsync(insights);

            return Ok(insights.Select(Map));
        }

        // Maps an Insight entity to an InsightResponse DTO
        private static InsightResponse Map(Insight i) =>
            new(
                i.Id,
                i.Type.ToString(),
                i.Title,
                i.Message,
                i.Category,
                i.ChangePercent,
                i.Severity.ToString(),
                i.GeneratedAt
            );
    }
}