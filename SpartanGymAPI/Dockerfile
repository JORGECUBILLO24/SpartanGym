# ---------- Etapa de build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -B -DskipTests clean package

# ---------- Etapa de ejecucion ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Render inyecta la variable PORT; la app la lee con server.port=${PORT:8080}
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
