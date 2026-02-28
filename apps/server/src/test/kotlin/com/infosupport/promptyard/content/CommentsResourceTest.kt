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
import org.hamcrest.Matchers.notNullValue
import org.hamcrest.Matchers.hasSize
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import java.time.Instant

@QuarkusTest
class CommentsResourceTest {

    @Inject
    lateinit var contentItemRepository: ContentItemRepository

    @Inject
    lateinit var commentRepository: CommentRepository

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var factory: TestObjectFactory

    @AfterEach
    @Transactional
    fun cleanUp() {
        commentRepository.deleteAll()
        contentItemRepository.deleteAll()
        userProfileRepository.deleteAll()
    }

    // -------------------------------------------------------------------------
    // POST /api/content/prompts/{slug}/comments — authenticated, happy path
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-comment-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Comment User"),
        Claim(key = "email", value = "comment.user@example.com")
    ])
    fun `returns 201 with comment details when a valid comment is submitted`() {
        val profile = factory.createUserProfile("sub-comment-user", "Comment User", "comment.user@example.com")
        factory.createPrompt(profile, "Commentable Prompt")

        val body = """{"text": "Great prompt, very helpful!"}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts/commentable-prompt/comments")
        } Then {
            statusCode(201)
            body("id", notNullValue())
            body("text", equalTo("Great prompt, very helpful!"))
            body("createdAt", notNullValue())
            body("authorFullName", equalTo("Comment User"))
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/content/prompts/{slug}/comments — blank text
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-blank-comment-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Blank Comment User"),
        Claim(key = "email", value = "blank.comment@example.com")
    ])
    fun `returns 400 when comment text is blank`() {
        val profile = factory.createUserProfile("sub-blank-comment-user", "Blank Comment User", "blank.comment@example.com")
        factory.createPrompt(profile, "Blank Comment Prompt")

        val body = """{"text": "   "}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts/blank-comment-prompt/comments")
        } Then {
            statusCode(400)
        }
    }

    @Test
    @TestSecurity(user = "sub-empty-comment-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Empty Comment User"),
        Claim(key = "email", value = "empty.comment@example.com")
    ])
    fun `returns 400 when comment text is empty`() {
        val profile = factory.createUserProfile("sub-empty-comment-user", "Empty Comment User", "empty.comment@example.com")
        factory.createPrompt(profile, "Empty Comment Prompt")

        val body = """{"text": ""}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts/empty-comment-prompt/comments")
        } Then {
            statusCode(400)
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/content/prompts/{slug}/comments — prompt not found
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-notfound-comment-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Notfound Comment User"),
        Claim(key = "email", value = "notfound.comment@example.com")
    ])
    fun `returns 404 when posting comment on non-existent prompt`() {
        factory.createUserProfile("sub-notfound-comment-user", "Notfound Comment User", "notfound.comment@example.com")

        val body = """{"text": "A comment"}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts/nonexistent-prompt/comments")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/content/prompts/{slug}/comments — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `returns 401 when posting comment without authentication`() {
        val body = """{"text": "Unauthorized comment"}"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts/some-slug/comments")
        } Then {
            statusCode(401)
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug}/comments — authenticated, happy path
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-list-comments-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "List Comments User"),
        Claim(key = "email", value = "list.comments@example.com")
    ])
    fun `returns comments sorted by createdAt descending`() {
        val profile = factory.createUserProfile("sub-list-comments-user", "List Comments User", "list.comments@example.com")
        val prompt = factory.createPrompt(profile, "Listed Prompt")

        val earlier = Instant.parse("2026-01-01T10:00:00Z")
        val middle = Instant.parse("2026-01-01T11:00:00Z")
        val later = Instant.parse("2026-01-01T12:00:00Z")

        factory.createComment(profile, prompt, "First comment", createdAt = earlier)
        factory.createComment(profile, prompt, "Second comment", createdAt = middle)
        factory.createComment(profile, prompt, "Third comment", createdAt = later)

        When {
            get("/api/content/prompts/listed-prompt/comments")
        } Then {
            statusCode(200)
            body("$", hasSize<Any>(3))
            body("[0].text", equalTo("Third comment"))
            body("[1].text", equalTo("Second comment"))
            body("[2].text", equalTo("First comment"))
            body("[0].authorFullName", equalTo("List Comments User"))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug}/comments — empty list
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-empty-list-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Empty List User"),
        Claim(key = "email", value = "empty.list@example.com")
    ])
    fun `returns empty list when prompt has no comments`() {
        val profile = factory.createUserProfile("sub-empty-list-user", "Empty List User", "empty.list@example.com")
        factory.createPrompt(profile, "No Comments Prompt")

        When {
            get("/api/content/prompts/no-comments-prompt/comments")
        } Then {
            statusCode(200)
            body("$", hasSize<Any>(0))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug}/comments — prompt not found
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-get-notfound-comments-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Get Notfound Comments User"),
        Claim(key = "email", value = "get.notfound.comments@example.com")
    ])
    fun `returns 404 when listing comments for non-existent prompt`() {
        factory.createUserProfile("sub-get-notfound-comments-user", "Get Notfound Comments User", "get.notfound.comments@example.com")

        When {
            get("/api/content/prompts/nonexistent-prompt/comments")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content/prompts/{slug}/comments — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `returns 401 when listing comments without authentication`() {
        When {
            get("/api/content/prompts/some-slug/comments")
        } Then {
            statusCode(401)
        }
    }
}
