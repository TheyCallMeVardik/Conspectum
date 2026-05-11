FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/Shared/DiplomaProject.Shared/DiplomaProject.Shared.csproj backend/Shared/DiplomaProject.Shared/
COPY backend/Gateway/ApiGateway/ApiGateway.csproj backend/Gateway/ApiGateway/

RUN dotnet restore backend/Gateway/ApiGateway/ApiGateway.csproj

COPY backend/Shared/ backend/Shared/
COPY backend/Gateway/ApiGateway/ backend/Gateway/ApiGateway/

RUN dotnet publish backend/Gateway/ApiGateway/ApiGateway.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ApiGateway.dll"]
