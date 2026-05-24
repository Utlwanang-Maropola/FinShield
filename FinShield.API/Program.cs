using FinShield.API.Middleware;
using FinShield.Core.Interfaces;
using FinShield.Core.Services;
using FinShield.Infrastructure.Data;
using FinShield.Infrastructure.Repositories;
using FinShield.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// --- Database ---
// Register the DbContext with SQL Server
// The connection string is read from appsettings.json
builder.Services.AddDbContext<FinShieldDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- Dependency Injection ---
// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<IFraudAlertRepository, FraudAlertRepository>();
builder.Services.AddScoped<IBudgetRepository, BudgetRepository>();
builder.Services.AddScoped<IInsightRepository, InsightRepository>();

// Domain Services
builder.Services.AddScoped<IFraudDetectionService, FraudDetectionService>();
builder.Services.AddScoped<IInsightsService, InsightsService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// --- JWT Authentication ---
// Configure the API to validate JWT tokens on every request
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// --- CORS ---
// Allow the Angular dev server to call the API
builder.Services.AddCors(opt =>
    opt.AddPolicy("AngularDev", p =>
        p.WithOrigins("http://localhost:4200")
         .AllowAnyMethod()
         .AllowAnyHeader()));

// --- OpenAPI ---
// Built-in .NET 10 OpenAPI support - replaces Swashbuckle
// Access the API docs at /openapi/v1.json in development
builder.Services.AddOpenApi();

var app = builder.Build();

// --- Middleware Pipeline ---
// Global exception handler must be first
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

// CORS must come before Authentication and Authorization
app.UseCors("AngularDev");

// Authentication must come before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();