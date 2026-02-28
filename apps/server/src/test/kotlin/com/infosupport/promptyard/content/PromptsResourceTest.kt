package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfileRepository
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.oidc.Claim
import io.quarkus.test.security.oidc.OidcSecurity
import io.quarkus.test.security.TestSecurity
import io.restassured.module.kotlin.extensions.Given
import io.restassured.module.kotlin.extensions.Then
import io.restassured.module.kotlin.extensions.When
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.core.MediaType
import org.hamcrest.Matchers.equalTo
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test

@QuarkusTest
class PromptsResourceTest {

    @Inject
    lateinit var contentItemRepository: com.infosupport.promptyard.content.ContentItemRepository

    @Inject
    lateinit var userProfileRepository: com.infosupport.promptyard.profiles.UserProfileRepository

    @Inject
    lateinit var factory: com.infosupport.promptyard.content.TestObjectFactory

    @AfterEach
    @Transactional
    fun cleanUp() {
        contentItemRepository.deleteAll()
        userProfileRepository.deleteAll()
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug} — authenticated, happy path
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-get-prompt-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Get Prompt User"),
        Claim(key = "email", value = "get.prompt@example.com")
    ])
    fun `returns 200 with prompt details when prompt exists`() {
        val profile = factory.createUserProfile("sub-get-prompt-user", "Get Prompt User", "get.prompt@example.com")
        factory.createPrompt(
            author = profile,
            title = "My Test Prompt",
            tags = listOf("kotlin", "testing"),
            description = "A test prompt description",
            content = "Tell me about Kotlin",
        )

        When {
            get("/api/content/prompts/my-test-prompt")
        } Then {
            statusCode(200)
            body("title", equalTo("My Test Prompt"))
            body("slug", equalTo("my-test-prompt"))
            body("description", equalTo("A test prompt description"))
            body("content", equalTo("Tell me about Kotlin"))
            body("tags", equalTo(listOf("kotlin", "testing")))
            body("contentType", equalTo("prompt"))
            body("createdAt", org.hamcrest.Matchers.notNullValue())
            body("author.fullName", equalTo("Get Prompt User"))
            body("author.profileSlug", equalTo("get-prompt-user"))
            body("author.promptCount", equalTo(1))
            body("author.skillCount", equalTo(0))
            body("author.agentCount", equalTo(0))
            body("author.workflowCount", equalTo(0))
        }
    }

    @Test
    @TestSecurity(user = "sub-get-counts-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Counts User"),
        Claim(key = "email", value = "counts.user@example.com")
    ])
    fun `returns correct author content counts when author has multiple prompts`() {
        val profile = factory.createUserProfile("sub-get-counts-user", "Counts User", "counts.user@example.com")
        factory.createPrompt(profile, "Prompt One")
        factory.createPrompt(profile, "Prompt Two")
        factory.createPrompt(profile, "Prompt Three")

        When {
            get("/api/content/prompts/prompt-one")
        } Then {
            statusCode(200)
            body("author.promptCount", equalTo(3))
            body("author.skillCount", equalTo(0))
            body("author.agentCount", equalTo(0))
            body("author.workflowCount", equalTo(0))
        }
    }

    @Test
    @TestSecurity(user = "sub-get-null-modified-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Null Modified User"),
        Claim(key = "email", value = "null.modified@example.com")
    ])
    fun `returns null modifiedAt when prompt has not been modified`() {
        val profile = factory.createUserProfile("sub-get-null-modified-user", "Null Modified User", "null.modified@example.com")
        factory.createPrompt(profile, "Unmodified Prompt")

        When {
            get("/api/content/prompts/unmodified-prompt")
        } Then {
            statusCode(200)
            body("modifiedAt", org.hamcrest.Matchers.nullValue())
        }
    }

    @Test
    @TestSecurity(user = "sub-get-jobtitle-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Job Title User"),
        Claim(key = "email", value = "jobtitle.user@example.com")
    ])
    fun `returns author job title when set`() {
        val profile = factory.createUserProfile(
            "sub-get-jobtitle-user", "Job Title User", "jobtitle.user@example.com",
            jobTitle = "Senior Engineer",
        )
        factory.createPrompt(profile, "Job Title Prompt")

        When {
            get("/api/content/prompts/job-title-prompt")
        } Then {
            statusCode(200)
            body("author.jobTitle", equalTo("Senior Engineer"))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug} — isOwner flag
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-owner-flag-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Owner Flag User"),
        Claim(key = "email", value = "owner.flag@example.com")
    ])
    fun `returns isOwner true when authenticated user is the prompt author`() {
        val profile = factory.createUserProfile("sub-owner-flag-user", "Owner Flag User", "owner.flag@example.com")
        factory.createPrompt(profile, "Owner Check Prompt")

        When {
            get("/api/content/prompts/owner-check-prompt")
        } Then {
            statusCode(200)
            body("isOwner", equalTo(true))
        }
    }

    @Test
    @TestSecurity(user = "sub-not-owner-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Not Owner User"),
        Claim(key = "email", value = "not.owner@example.com")
    ])
    fun `returns isOwner false when authenticated user is not the prompt author`() {
        val author = factory.createUserProfile("sub-actual-author", "Actual Author", "actual.author@example.com")
        factory.createUserProfile("sub-not-owner-user", "Not Owner User", "not.owner@example.com")
        factory.createPrompt(author, "Other Owner Prompt")

        When {
            get("/api/content/prompts/other-owner-prompt")
        } Then {
            statusCode(200)
            body("isOwner", equalTo(false))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug} — not found
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-get-notfound-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Not Found User"),
        Claim(key = "email", value = "notfound.user@example.com")
    ])
    fun `returns 404 when no prompt exists with the given slug`() {
        factory.createUserProfile("sub-get-notfound-user", "Not Found User", "notfound.user@example.com")

        When {
            get("/api/content/prompts/nonexistent-slug")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug} — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `redirects to login when getting a prompt without authentication`() {
        Given {
            redirects().follow(false)
        } When {
            get("/api/content/prompts/some-slug")
        } Then {
            statusCode(302)
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/content/prompts — authenticated, profile exists
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-prompt-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Prompt User"),
        Claim(key = "email", value = "prompt.user@example.com")
    ])
    fun `returns 201 Created when a valid prompt is submitted`() {
        factory.createUserProfile("sub-prompt-user", "Prompt User", "prompt.user@example.com")

        val body = """{
            "title": "My First Prompt",
            "description": "A test prompt",
            "content": "Tell me about Kotlin",
            "tags": ["kotlin", "testing"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
        }
    }

    @Test
    @TestSecurity(user = "sub-slug-prompt-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Slug Prompt User"),
        Claim(key = "email", value = "slug.prompt@example.com")
    ])
    fun `response body contains slug derived from the prompt title`() {
        factory.createUserProfile("sub-slug-prompt-user", "Slug Prompt User", "slug.prompt@example.com")

        val body = """{
            "title": "My Slug Prompt",
            "description": "A test prompt",
            "content": "Tell me about slugs",
            "tags": []
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
            body("slug", equalTo("my-slug-prompt"))
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/content/prompts — authenticated, no existing profile
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-no-profile-prompt-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "No Profile User"),
        Claim(key = "email", value = "no.profile@example.com")
    ])
    fun `returns 404 when no user profile exists`() {
        val body = """{
            "title": "Profileless Prompt",
            "description": "A prompt without a pre-existing profile",
            "content": "Some content",
            "tags": []
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/content/prompts — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `redirects to login when no authentication is provided`() {
        val body = """{
            "title": "Unauthorized Prompt",
            "description": "Should be rejected",
            "content": "Some content",
            "tags": []
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
            redirects().follow(false)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(302)
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/content/prompts/{slug} — authenticated, happy path
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-update-prompt-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Update Prompt User"),
        Claim(key = "email", value = "update.prompt@example.com")
    ])
    fun `returns 200 with slug when prompt is updated successfully`() {
        val profile = factory.createUserProfile("sub-update-prompt-user", "Update Prompt User", "update.prompt@example.com")
        factory.createPrompt(
            author = profile,
            title = "Original Title",
            description = "Original description",
            content = "Original content",
            tags = listOf("original"),
        )

        val body = """{
            "title": "Updated Title",
            "description": "Updated description",
            "content": "Updated content",
            "tags": ["updated", "edited"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            put("/api/content/prompts/original-title")
        } Then {
            statusCode(200)
            body("slug", equalTo("original-title"))
        }
    }

    @Test
    @TestSecurity(user = "sub-update-verify-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Update Verify User"),
        Claim(key = "email", value = "update.verify@example.com")
    ])
    fun `prompt fields are updated in the database after successful update`() {
        val profile = factory.createUserProfile("sub-update-verify-user", "Update Verify User", "update.verify@example.com")
        factory.createPrompt(
            author = profile,
            title = "Verify Update",
            description = "Before",
            content = "Before content",
            tags = listOf("before"),
        )

        val body = """{
            "title": "After Title",
            "description": "After description",
            "content": "After content",
            "tags": ["after"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            put("/api/content/prompts/verify-update")
        } Then {
            statusCode(200)
        }

        // Verify the prompt was updated by fetching it
        When {
            get("/api/content/prompts/verify-update")
        } Then {
            statusCode(200)
            body("title", equalTo("After Title"))
            body("description", equalTo("After description"))
            body("content", equalTo("After content"))
            body("tags", equalTo(listOf("after")))
            body("slug", equalTo("verify-update"))
            body("modifiedAt", org.hamcrest.Matchers.notNullValue())
        }
    }

    @Test
    @TestSecurity(user = "sub-update-slug-stable-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Slug Stable User"),
        Claim(key = "email", value = "slug.stable@example.com")
    ])
    fun `slug remains unchanged when title is updated`() {
        val profile = factory.createUserProfile("sub-update-slug-stable-user", "Slug Stable User", "slug.stable@example.com")
        factory.createPrompt(author = profile, title = "Stable Slug Prompt")

        val body = """{
            "title": "Completely Different Title",
            "description": "New description",
            "content": "New content",
            "tags": ["new"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            put("/api/content/prompts/stable-slug-prompt")
        } Then {
            statusCode(200)
            body("slug", equalTo("stable-slug-prompt"))
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/content/prompts/{slug} — authenticated, not found
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-update-notfound-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Update Notfound User"),
        Claim(key = "email", value = "update.notfound@example.com")
    ])
    fun `returns 404 when updating a prompt that does not exist`() {
        factory.createUserProfile("sub-update-notfound-user", "Update Notfound User", "update.notfound@example.com")

        val body = """{
            "title": "Updated Title",
            "description": "Updated description",
            "content": "Updated content",
            "tags": ["updated"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            put("/api/content/prompts/nonexistent-prompt")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // PUT /api/content/prompts/{slug} — authenticated, not the author
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-update-forbidden-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Update Forbidden User"),
        Claim(key = "email", value = "update.forbidden@example.com")
    ])
    fun `returns 403 when updating a prompt owned by a different author`() {
        val owner = factory.createUserProfile("sub-update-owner", "Update Owner", "update.owner@example.com")
        factory.createUserProfile("sub-update-forbidden-user", "Update Forbidden User", "update.forbidden@example.com")
        factory.createPrompt(owner, "Forbidden Update Prompt")

        val body = """{
            "title": "Hacked Title",
            "description": "Hacked description",
            "content": "Hacked content",
            "tags": ["hacked"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            put("/api/content/prompts/forbidden-update-prompt")
        } Then {
            statusCode(403)
        }
    }

    @Test
    @TestSecurity(user = "sub-update-forbidden-verify")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Update Forbidden Verify"),
        Claim(key = "email", value = "update.forbidden.verify@example.com")
    ])
    fun `prompt is not modified when update is forbidden`() {
        val owner = factory.createUserProfile("sub-update-verify-owner", "Update Verify Owner", "update.verify.owner@example.com")
        factory.createUserProfile("sub-update-forbidden-verify", "Update Forbidden Verify", "update.forbidden.verify@example.com")
        factory.createPrompt(
            author = owner,
            title = "Protected Prompt",
            description = "Original description",
            content = "Original content",
            tags = listOf("original"),
        )

        val body = """{
            "title": "Modified Title",
            "description": "Modified",
            "content": "Modified",
            "tags": ["modified"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            put("/api/content/prompts/protected-prompt")
        } Then {
            statusCode(403)
        }

        // Verify original data is preserved by fetching with the owner's identity
        // (We can't switch users mid-test, but we can verify via repository)
        val prompt = contentItemRepository.findBySlug("protected-prompt") as Prompt
        assert(prompt.title == "Protected Prompt") { "Expected title to remain unchanged" }
        assert(prompt.description == "Original description") { "Expected description to remain unchanged" }
        assert(prompt.content == "Original content") { "Expected content to remain unchanged" }
    }

    // -------------------------------------------------------------------------
    // PUT /api/content/prompts/{slug} — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `redirects to login when updating a prompt without authentication`() {
        val body = """{
            "title": "Unauthorized Update",
            "description": "Should be rejected",
            "content": "Some content",
            "tags": ["test"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
            redirects().follow(false)
        } When {
            put("/api/content/prompts/some-slug")
        } Then {
            statusCode(302)
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/content/prompts/{slug} — authenticated, happy path
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-delete-prompt-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Delete Prompt User"),
        Claim(key = "email", value = "delete.prompt@example.com")
    ])
    fun `returns 204 No Content when the prompt is deleted successfully`() {
        val profile = factory.createUserProfile("sub-delete-prompt-user", "Delete Prompt User", "delete.prompt@example.com")
        factory.createPrompt(profile, "Delete Me")

        When {
            delete("/api/content/prompts/delete-me")
        } Then {
            statusCode(204)
        }
    }

    @Test
    @TestSecurity(user = "sub-delete-verify-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Delete Verify User"),
        Claim(key = "email", value = "delete.verify@example.com")
    ])
    fun `prompt is removed from the repository after successful deletion`() {
        val profile = factory.createUserProfile("sub-delete-verify-user", "Delete Verify User", "delete.verify@example.com")
        factory.createPrompt(profile, "Removed Prompt")

        When {
            delete("/api/content/prompts/removed-prompt")
        } Then {
            statusCode(204)
        }

        assert(contentItemRepository.findBySlug("removed-prompt") == null) {
            "Expected the prompt to be deleted from the repository"
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/content/prompts/{slug} — authenticated, prompt not found
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-delete-missing-slug")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Delete Missing Slug"),
        Claim(key = "email", value = "delete.missing@example.com")
    ])
    fun `returns 404 Not Found when the prompt slug does not exist`() {
        factory.createUserProfile("sub-delete-missing-slug", "Delete Missing Slug", "delete.missing@example.com")

        When {
            delete("/api/content/prompts/nonexistent-slug")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/content/prompts/{slug} — authenticated, not the author
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-delete-forbidden")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Delete Forbidden User"),
        Claim(key = "email", value = "delete.forbidden@example.com")
    ])
    fun `returns 403 Forbidden when the prompt belongs to a different author`() {
        val owner = factory.createUserProfile("sub-other-owner", "Other Owner", "other.owner@example.com")
        factory.createUserProfile("sub-delete-forbidden", "Delete Forbidden User", "delete.forbidden@example.com")
        factory.createPrompt(owner, "Forbidden Prompt")

        When {
            delete("/api/content/prompts/forbidden-prompt")
        } Then {
            statusCode(403)
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/content/prompts/{slug} — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `redirects to login when deleting a prompt without authentication`() {
        Given {
            redirects().follow(false)
        } When {
            delete("/api/content/prompts/some-slug")
        } Then {
            statusCode(302)
        }
    }
}
