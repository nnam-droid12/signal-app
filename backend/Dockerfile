FROM eclipse-temurin:17-jre

# 1. Force port 8080 explicitly
ENV PORT=8080

COPY target/signal-0.0.1-SNAPSHOT.jar app.jar

# 2. Use "sh -c" to ensure the command runs in a shell that understands variables
#    AND explicitly hardcode the port to be 100% sure.
ENTRYPOINT ["java", "-Dserver.port=8080", "-jar", "/app.jar"]