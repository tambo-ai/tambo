plugins {
    kotlin("jvm") version "2.0.21"
    kotlin("plugin.serialization") version "2.0.21"
    id("maven-publish")
    id("signing")
}

group = "co.tambo"
version = "0.1.0"

repositories {
    mavenCentral()
    google()
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib:2.0.21")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("io.ktor:ktor-client-core:3.0.3")
    implementation("io.ktor:ktor-client-cio:3.0.3")
    implementation("io.ktor:ktor-client-content-negotiation:3.0.3")
    implementation("io.ktor:ktor-serialization-kotlinx-json:3.0.3")
    implementation("io.ktor:ktor-client-websockets:3.0.3")
    implementation("androidx.compose.runtime:runtime:1.7.6")
    
    testImplementation("org.jetbrains.kotlin:kotlin-test:2.0.21")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("io.mockk:mockk:1.13.15")
    testImplementation("junit:junit:4.13.2")
}

kotlin {
    jvmToolchain(17)
}

tasks.test {
    useJUnit()
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            
            pom {
                name.set("Tambo Kotlin SDK")
                description.set("Kotlin SDK for Tambo AI - Generative UI for Android")
                url.set("https://tambo.co")
                
                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }
                
                developers {
                    developer {
                        id.set("tambo-ai")
                        name.set("Tambo AI")
                        email.set("support@tambo.co")
                    }
                }
                
                scm {
                    connection.set("scm:git:git://github.com/tambo-ai/tambo.git")
                    developerConnection.set("scm:git:ssh://github.com/tambo-ai/tambo.git")
                    url.set("https://github.com/tambo-ai/tambo")
                }
            }
        }
    }
}
