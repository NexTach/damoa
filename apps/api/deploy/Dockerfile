# CI 에서 빌드된 Spring Boot 실행 jar(app.jar)를 패키징한다.
FROM eclipse-temurin:25-jre

WORKDIR /app
COPY app.jar /app/app.jar

EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
