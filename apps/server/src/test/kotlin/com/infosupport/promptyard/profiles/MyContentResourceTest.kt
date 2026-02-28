package com.infosupport.promptyard.profiles

import com.infosupport.promptyard.content.ContentItemRepository
import com.infosupport.promptyard.content.TestObjectFactory
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.TestSecurity
import io.restassured.module.kotlin.extensions.Given
import io.restassured.module.kotlin.extensions.Then
import io.restassured.module.kotlin.extensions.When
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.hasSize
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.temporal.ChronoUnit

@QuarkusTest
class MyContentResourceTest {

    @Inject
    lateinit var contentItemRepository: ContentItemRepository

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var factory: TestObjectFactory

    @AfterEach
    @Transactional
    fun cleanUp() {
        contentItemRepository.deleteAll()
        userProfileRepository.deleteAll()
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — empty list
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-my-content-user")
    fun `returns 200 with empty list when user has no content`() {
        factory.createUserProfile("sub-my-content-user", "My Content User", "my.content@example.com")

        When {
            get("/api/profiles/me/content")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(0))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(1))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — returns only current user's items
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-alice")
    fun `returns only the authenticated user's content items`() {
        val alice = factory.createUserProfile("sub-alice", "Alice", "alice@example.com")
        val bob = factory.createUserProfile("sub-bob", "Bob", "bob@example.com")

        repeat(3) { i -> factory.createPrompt(alice, "Alice Prompt $i") }
        repeat(5) { i -> factory.createPrompt(bob, "Bob Prompt $i") }

        When {
            get("/api/profiles/me/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(3))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — sort order (SC-008)
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-sort-user")
    fun `returns items sorted by createdAt descending (newest first)`() {
        val author = factory.createUserProfile("sub-sort-user", "Sort User", "sort@example.com")
        val now = Instant.now()

        factory.createPrompt(author, "Oldest Prompt", createdAt = now.minus(3, ChronoUnit.DAYS))
        factory.createPrompt(author, "Middle Prompt", createdAt = now.minus(1, ChronoUnit.DAYS))
        factory.createPrompt(author, "Newest Prompt", createdAt = now)

        When {
            get("/api/profiles/me/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(3))
            body("items[0].title", equalTo("Newest Prompt"))
            body("items[1].title", equalTo("Middle Prompt"))
            body("items[2].title", equalTo("Oldest Prompt"))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — pagination
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-paginate-user")
    fun `returns first page of 12 items when 13 items exist`() {
        val author = factory.createUserProfile("sub-paginate-user", "Paginate User", "paginate@example.com")
        repeat(13) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/profiles/me/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(12))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(2))
        }
    }

    @Test
    @TestSecurity(user = "sub-paginate-user2")
    fun `returns second page with remaining items when 13 items exist`() {
        val author = factory.createUserProfile("sub-paginate-user2", "Paginate User2", "paginate2@example.com")
        repeat(13) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/profiles/me/content?page=1")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(1))
            body("pageIndex", equalTo(1))
            body("totalPages", equalTo(2))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — defaults to page 0
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-default-page-user")
    fun `defaults to page 0 when no page parameter is provided`() {
        val author = factory.createUserProfile("sub-default-page-user", "Default Page User", "default.page@example.com")
        repeat(3) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/profiles/me/content")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(3))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(1))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — response includes authorName
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-author-name-user")
    fun `each content item includes authorName`() {
        val author = factory.createUserProfile("sub-author-name-user", "Willem Meints", "willem@example.com")
        factory.createPrompt(author, "My Prompt")

        When {
            get("/api/profiles/me/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(1))
            body("items[0].authorName", equalTo("Willem Meints"))
            body("items[0].slug", equalTo("my-prompt"))
            body("items[0].title", equalTo("My Prompt"))
            body("items[0].contentType", equalTo("prompt"))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — no profile returns 404
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-no-profile-content-user")
    fun `returns 404 when user has no profile`() {
        When {
            get("/api/profiles/me/content")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/me/content — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `redirects to login when no authentication is provided`() {
        Given {
            redirects().follow(false)
        } When {
            get("/api/profiles/me/content")
        } Then {
            statusCode(302)
        }
    }
}
