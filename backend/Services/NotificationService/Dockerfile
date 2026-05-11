FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/Shared/DiplomaProject.Shared/DiplomaProject.Shared.csproj backend/Shared/DiplomaProject.Shared/
COPY backend/Services/NotificationService/NotificationService.csproj backend/Services/NotificationService/

RUN dotnet restore backend/Services/NotificationService/NotificationService.csproj

COPY backend/Shared/ backend/Shared/
COPY backend/Services/NotificationService/ backend/Services/NotificationService/

RUN dotnet publish backend/Services/NotificationService/NotificationService.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "NotificationService.dll"]
