package io.github.snowykte0426.damoa.config

import java.net.URI
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.S3Configuration
import software.amazon.awssdk.services.s3.model.CreateBucketRequest
import software.amazon.awssdk.services.s3.model.HeadBucketRequest

@Configuration(proxyBeanMethods = false)
class S3Config {
    @Bean
    fun s3Client(props: AppProperties): S3Client {
        val s3 = props.s3
        val client = S3Client.builder()
            .endpointOverride(URI.create(s3.endpoint))
            .region(Region.of(s3.region))
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(s3.accessKey, s3.secretKey),
                ),
            )
            .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
            .httpClient(UrlConnectionHttpClient.builder().build())
            .build()
        ensureBucket(client, s3.bucket)
        return client
    }

    // Best effort: never fail startup if the storage is temporarily unreachable.
    private fun ensureBucket(client: S3Client, bucket: String) {
        runCatching { client.headBucket(HeadBucketRequest.builder().bucket(bucket).build()) }
            .onFailure {
                runCatching {
                    client.createBucket(CreateBucketRequest.builder().bucket(bucket).build())
                }
            }
    }
}
