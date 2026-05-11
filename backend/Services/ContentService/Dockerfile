FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/Shared/DiplomaProject.Shared/DiplomaProject.Shared.csproj backend/Shared/DiplomaProject.Shared/
COPY backend/Services/ContentService/ContentService.csproj backend/Services/ContentService/

RUN dotnet restore backend/Services/ContentService/ContentService.csproj

COPY backend/Shared/ backend/Shared/
COPY backend/Services/ContentService/ backend/Services/ContentService/

RUN dotnet publish backend/Services/ContentService/ContentService.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ContentService.dll"]
