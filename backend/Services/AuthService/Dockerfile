FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files for restore (layer-cache friendly)
COPY backend/Shared/DiplomaProject.Shared/DiplomaProject.Shared.csproj backend/Shared/DiplomaProject.Shared/
COPY backend/Services/AuthService/AuthService.csproj backend/Services/AuthService/

RUN dotnet restore backend/Services/AuthService/AuthService.csproj

# Copy remaining sources
COPY backend/Shared/ backend/Shared/
COPY backend/Services/AuthService/ backend/Services/AuthService/

RUN dotnet publish backend/Services/AuthService/AuthService.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "AuthService.dll"]
