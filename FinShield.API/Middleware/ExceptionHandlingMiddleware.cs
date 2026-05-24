using System.Net;
using System.Text.Json;

namespace FinShield.API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        /// <summary>
        /// Intercepts every HTTP request.
        /// If an unhandled exception is thrown anywhere in the API,
        /// this catches it and returns a clean JSON error response
        /// instead of exposing a raw stack trace to the client.
        /// </summary>
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Pass the request to the next middleware in the pipeline
                await _next(context);
            }
            catch (KeyNotFoundException ex)
            {
                // Thrown when a repository can't find a record
                await WriteError(context, HttpStatusCode.NotFound, ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                // Thrown when a user tries to access something they don't own
                await WriteError(context, HttpStatusCode.Forbidden, ex.Message);
            }
            catch (Exception ex)
            {
                // Catch all other unexpected exceptions
                // Log the full error server-side but return a generic message to the client
                // Never expose internal error details to the outside world
                _logger.LogError(ex, "Unhandled exception");
                await WriteError(context, HttpStatusCode.InternalServerError, "An unexpected error occurred.");
            }
        }

        // Writes a JSON error response with the given status code and message
        private static async Task WriteError(HttpContext ctx, HttpStatusCode status, string message)
        {
            ctx.Response.StatusCode = (int)status;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { error = message }));
        }
    }
}