package com.infosupport.promptyard.profiles

import com.infosupport.promptyard.content.TestObjectFactory
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.TestSecurity
import io.quarkus.test.security.oidc.Claim
import io.quarkus.test.security.oidc.OidcSecurity
import io.restassured.module.kotlin.extensions.Given
import io.restassured.module.kotlin.extensions.Then
import io.restassured.module.kotlin.extensions.When
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.matchesPattern
import org.hamcrest.Matchers.notNullValue
import org.hamcrest.Matchers.nullValue
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.core.MediaType

@QuarkusTest
class UserProfilesResourceTest {

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var testObjectFactory: TestObjectFactory

    @AfterEach
    @Transactional
    fun cleanUp() {
        userProfileRepository.deleteAll()
    }

    // -------------------------------------------------------------------------
    // Onboarding a new user
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-new-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "New User"),
        Claim(key = "email", value = "new.user@example.com")
    ])
    fun `returns 201 Created when onboarding a new user`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": true}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(201)
        }
    }

    @Test
    @TestSecurity(user = "sub-slug-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Slug User"),
        Claim(key = "email", value = "slug.user@example.com")
    ])
    fun `response body contains slug derived from user name`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": true}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(201)
            body("slug", equalTo("slug-user"))
        }
    }

    @Test
    @TestSecurity(user = "sub-location-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Location User"),
        Claim(key = "email", value = "location.user@example.com")
    ])
    fun `Location header points to the new profile URL`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": true}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(201)
            header("Location", matchesPattern(".*/api/profiles/location-user"))
        }
    }

    // -------------------------------------------------------------------------
    // Privacy acceptance validation
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-no-privacy-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "No Privacy User"),
        Claim(key = "email", value = "no.privacy@example.com")
    ])
    fun `returns 400 when privacyAccepted is false`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": false}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(400)
            body("error", equalTo("Privacy statement must be accepted"))
        }
    }

    @Test
    @TestSecurity(user = "sub-missing-privacy-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Missing Privacy User"),
        Claim(key = "email", value = "missing.privacy@example.com")
    ])
    fun `returns 400 when privacyAccepted is missing`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(400)
            body("error", equalTo("Privacy statement must be accepted"))
        }
    }

    @Test
    @TestSecurity(user = "sub-privacy-ok-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Privacy Ok User"),
        Claim(key = "email", value = "privacy.ok@example.com")
    ])
    fun `returns 201 when privacyAccepted is true`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": true}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(201)
        }
    }

    @Test
    @TestSecurity(user = "sub-privacy-persist-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Privacy Persist User"),
        Claim(key = "email", value = "privacy.persist@example.com")
    ])
    fun `privacyAcceptedAt is set on newly created profile`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": true}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(201)
        }

        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("privacyAcceptedAt", notNullValue())
        }
    }

    @Test
    @TestSecurity(user = "sub-privacy-immutable-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Privacy Immutable User"),
        Claim(key = "email", value = "privacy.immutable@example.com")
    ])
    fun `privacyAcceptedAt is not modified by PUT`() {
        testObjectFactory.createUserProfile(
            "sub-privacy-immutable-user",
            "Privacy Immutable User",
            "privacy.immutable@example.com"
        )

        // Retrieve original privacyAcceptedAt
        val originalPrivacyAcceptedAt: String = io.restassured.RestAssured.given()
            .`when`().get("/api/profiles/me")
            .then().statusCode(200)
            .extract().path("privacyAcceptedAt")

        // Update profile
        val updateBody = """{"jobTitle":"Architect","businessUnit":"IT"}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(updateBody)
        } When {
            put("/api/profiles/me")
        } Then {
            statusCode(202)
        }

        // Verify privacyAcceptedAt is unchanged
        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("privacyAcceptedAt", equalTo(originalPrivacyAcceptedAt))
        }
    }

    // -------------------------------------------------------------------------
    // Onboarding an already-existing user (idempotent)
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-existing-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Existing User"),
        Claim(key = "email", value = "existing.user@example.com")
    ])
    fun `returns 200 OK when user is already onboarded`() {
        testObjectFactory.createUserProfile("sub-existing-user", "Existing User", "existing.user@example.com")

        // Second call should return the existing profile
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(200)
            body("slug", equalTo("existing-user"))
        }
    }

    @Test
    @TestSecurity(user = "sub-existing-privacy-false-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Existing Privacy False User"),
        Claim(key = "email", value = "existing.privacy.false@example.com")
    ])
    fun `existing user POST returns 200 regardless of privacyAccepted value`() {
        testObjectFactory.createUserProfile(
            "sub-existing-privacy-false-user",
            "Existing Privacy False User",
            "existing.privacy.false@example.com"
        )

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": false}""")
        } When {
            post("/api/profiles")
        } Then {
            statusCode(200)
        }
    }

    // -------------------------------------------------------------------------
    // Retrieving a user profile by slug
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-get-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Get User"),
        Claim(key = "email", value = "get.user@example.com")
    ])
    fun `returns 200 OK with profile when slug exists`() {
        testObjectFactory.createUserProfile("sub-get-user", "Get User", "get.user@example.com")

        When {
            get("/api/profiles/get-user")
        } Then {
            statusCode(200)
            body("slug", equalTo("get-user"))
            body("fullName", equalTo("Get User"))
            body("emailAddress", equalTo("get.user@example.com"))
            body("subjectName", equalTo(null))
        }
    }

    @Test
    @TestSecurity(user = "sub-missing-user")
    fun `returns 404 Not Found when slug does not exist`() {
        When {
            get("/api/profiles/nonexistent-slug")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // Retrieving the current user's profile
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-me-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Me User"),
        Claim(key = "email", value = "me.user@example.com")
    ])
    fun `returns 200 OK with profile for current user`() {
        testObjectFactory.createUserProfile("sub-me-user", "Me User", "me.user@example.com")

        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("slug", equalTo("me-user"))
            body("fullName", equalTo("Me User"))
            body("emailAddress", equalTo("me.user@example.com"))
            body("subjectName", equalTo(null))
        }
    }

    @Test
    @TestSecurity(user = "sub-no-profile-user")
    fun `returns 404 Not Found when current user has no profile`() {
        When {
            get("/api/profiles/me")
        } Then {
            statusCode(404)
        }
    }

    @Test
    @TestSecurity(user = "sub-me-privacy-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Me Privacy User"),
        Claim(key = "email", value = "me.privacy@example.com")
    ])
    fun `GET me includes privacyAcceptedAt in response`() {
        testObjectFactory.createUserProfile("sub-me-privacy-user", "Me Privacy User", "me.privacy@example.com")

        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("privacyAcceptedAt", notNullValue())
        }
    }

    @Test
    @TestSecurity(user = "sub-me-no-privacy-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Me No Privacy User"),
        Claim(key = "email", value = "me.no.privacy@example.com")
    ])
    fun `GET me returns null privacyAcceptedAt for legacy profile`() {
        testObjectFactory.createUserProfile(
            "sub-me-no-privacy-user",
            "Me No Privacy User",
            "me.no.privacy@example.com",
            privacyAcceptedAt = null
        )

        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("privacyAcceptedAt", nullValue())
        }
    }

    // -------------------------------------------------------------------------
    // Updating the current user's profile
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-update-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Update User"),
        Claim(key = "email", value = "update.user@example.com")
    ])
    fun `returns 202 Accepted when profile update succeeds`() {
        testObjectFactory.createUserProfile("sub-update-user", "Update User", "update.user@example.com")

        val updateBody = """{"jobTitle":"Engineer","businessUnit":"R&D"}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(updateBody)
        } When {
            put("/api/profiles/me")
        } Then {
            statusCode(202)
        }
    }

    @Test
    @TestSecurity(user = "sub-update-verify-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Update Verify User"),
        Claim(key = "email", value = "update.verify@example.com")
    ])
    fun `profile fields are updated after PUT request`() {
        testObjectFactory.createUserProfile("sub-update-verify-user", "Update Verify User", "update.verify@example.com")

        val updateBody = """{"jobTitle":"Lead","businessUnit":"Engineering"}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(updateBody)
        } When {
            put("/api/profiles/me")
        } Then {
            statusCode(202)
        }

        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("fullName", equalTo("Update Verify User"))
            body("emailAddress", equalTo("update.verify@example.com"))
            body("jobTitle", equalTo("Lead"))
            body("businessUnit", equalTo("Engineering"))
        }
    }

    @Test
    @TestSecurity(user = "sub-update-missing-user")
    fun `returns 404 Not Found when updating profile for user with no profile`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"jobTitle":"Ghost"}""")
        } When {
            put("/api/profiles/me")
        } Then {
            statusCode(404)
        }
    }

    @Test
    @TestSecurity(user = "sub-preserve-idp-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Preserve IdP User"),
        Claim(key = "email", value = "preserve.idp@example.com")
    ])
    fun `PUT preserves fullName and emailAddress from original profile`() {
        testObjectFactory.createUserProfile(
            "sub-preserve-idp-user",
            "Preserve IdP User",
            "preserve.idp@example.com"
        )

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"jobTitle":"New Title","businessUnit":"New Unit"}""")
        } When {
            put("/api/profiles/me")
        } Then {
            statusCode(202)
        }

        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("fullName", equalTo("Preserve IdP User"))
            body("emailAddress", equalTo("preserve.idp@example.com"))
            body("jobTitle", equalTo("New Title"))
            body("businessUnit", equalTo("New Unit"))
        }
    }

    @Test
    @TestSecurity(user = "sub-clear-fields-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Clear Fields User"),
        Claim(key = "email", value = "clear.fields@example.com")
    ])
    fun `PUT with null fields clears jobTitle and businessUnit`() {
        testObjectFactory.createUserProfile(
            "sub-clear-fields-user",
            "Clear Fields User",
            "clear.fields@example.com",
            jobTitle = "Old Title"
        )

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{}""")
        } When {
            put("/api/profiles/me")
        } Then {
            statusCode(202)
        }

        When {
            get("/api/profiles/me")
        } Then {
            statusCode(200)
            body("jobTitle", nullValue())
            body("businessUnit", nullValue())
        }
    }

    // -------------------------------------------------------------------------
    // Unauthenticated access
    // -------------------------------------------------------------------------

    @Test
    fun `POST profiles redirects to login when no authentication is provided`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"privacyAccepted": true}""")
            redirects().follow(false)
        } When {
            post("/api/profiles")
        } Then {
            statusCode(302)
        }
    }

    @Test
    fun `GET profiles me redirects to login when no authentication is provided`() {
        Given {
            redirects().follow(false)
        } When {
            get("/api/profiles/me")
        } Then {
            statusCode(302)
        }
    }

    @Test
    fun `PUT profiles me redirects to login when no authentication is provided`() {
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{"jobTitle":"Ghost"}""")
            redirects().follow(false)
        } When {
            put("/api/profiles/me")
        } Then {
            statusCode(302)
        }
    }

    @Test
    fun `GET profiles by slug redirects to login when no authentication is provided`() {
        Given {
            redirects().follow(false)
        } When {
            get("/api/profiles/some-slug")
        } Then {
            statusCode(302)
        }
    }
}
