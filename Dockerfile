FROM node:20 AS client-build
WORKDIR /src/client

COPY src/PointRealm.Client/package.json src/PointRealm.Client/package-lock.json ./
RUN npm ci

COPY src/PointRealm.Client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS server-build
WORKDIR /src
COPY . .

COPY --from=client-build /src/client/dist ./src/PointRealm.Server/Api/wwwroot
RUN dotnet publish ./src/PointRealm.Server/Api/PointRealm.Server.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=server-build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "PointRealm.Server.Api.dll"]
