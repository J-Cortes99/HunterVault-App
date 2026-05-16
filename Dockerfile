# ─────────────────────────────────────────────────────────────
# HunterVault.Api · Multi-stage build (ARM64-friendly)
# ─────────────────────────────────────────────────────────────

# Stage 1 — restore + publish
FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src

# Copy csproj files first to leverage Docker layer cache
COPY HunterVault.slnx ./
COPY HunterVault.Domain/HunterVault.Domain.csproj            HunterVault.Domain/
COPY HunterVault.Application/HunterVault.Application.csproj  HunterVault.Application/
COPY HunterVault.Infrastructure/HunterVault.Infrastructure.csproj HunterVault.Infrastructure/
COPY HunterVault.Api/HunterVault.Api.csproj                  HunterVault.Api/

RUN dotnet restore HunterVault.Api/HunterVault.Api.csproj

# Now copy the rest and publish
COPY HunterVault.Domain/         HunterVault.Domain/
COPY HunterVault.Application/    HunterVault.Application/
COPY HunterVault.Infrastructure/ HunterVault.Infrastructure/
COPY HunterVault.Api/            HunterVault.Api/

RUN dotnet publish HunterVault.Api/HunterVault.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# Stage 2 — runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS runtime
WORKDIR /app

# Non-root user (security best practice)
RUN groupadd -r huntervault && useradd -r -g huntervault -d /app huntervault \
 && chown -R huntervault:huntervault /app
USER huntervault

COPY --from=build --chown=huntervault:huntervault /app/publish .

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 8080

ENTRYPOINT ["dotnet", "HunterVault.Api.dll"]
