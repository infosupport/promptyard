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
class ProfileContentResourceTest {

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
    // GET /api/profiles/{slug}/content — empty list
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-profile-content-viewer")
    fun `returns 200 with empty list when user has no content`() {
        factory.createUserProfile("sub-profile-content-viewer", "Viewer", "viewer@example.com")
        val target = factory.createUserProfile("sub-target-empty", "Target Empty", "target.empty@example.com")

        When {
            get("/api/profiles/${target.slug}/content")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(0))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(1))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/{slug}/content — returns only the requested user's content
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-profile-content-viewer2")
    fun `returns only the requested user's content when multiple users exist`() {
        factory.createUserProfile("sub-profile-content-viewer2", "Viewer Two", "viewer2@example.com")
        val alice = factory.createUserProfile("sub-alice-pc", "Alice Pc", "alice.pc@example.com")
        val bob = factory.createUserProfile("sub-bob-pc", "Bob Pc", "bob.pc@example.com")

        repeat(3) { i -> factory.createPrompt(alice, "Alice Prompt $i") }
        repeat(5) { i -> factory.createPrompt(bob, "Bob Prompt $i") }

        When {
            get("/api/profiles/${alice.slug}/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(3))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/{slug}/content — sort order
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-profile-content-viewer3")
    fun `returns items sorted by createdAt descending (newest first)`() {
        factory.createUserProfile("sub-profile-content-viewer3", "Viewer Three", "viewer3@example.com")
        val author = factory.createUserProfile("sub-sort-target", "Sort Target", "sort.target@example.com")
        val now = Instant.now()

        factory.createPrompt(author, "Oldest Prompt", createdAt = now.minus(3, ChronoUnit.DAYS))
        factory.createPrompt(author, "Middle Prompt", createdAt = now.minus(1, ChronoUnit.DAYS))
        factory.createPrompt(author, "Newest Prompt", createdAt = now)

        When {
            get("/api/profiles/${author.slug}/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(3))
            body("items[0].title", equalTo("Newest Prompt"))
            body("items[1].title", equalTo("Middle Prompt"))
            body("items[2].title", equalTo("Oldest Prompt"))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/{slug}/content — pagination
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-profile-content-viewer4")
    fun `returns first page of 12 items when 13 items exist`() {
        factory.createUserProfile("sub-profile-content-viewer4", "Viewer Four", "viewer4@example.com")
        val author = factory.createUserProfile("sub-paginate-target", "Paginate Target", "paginate.target@example.com")
        repeat(13) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/profiles/${author.slug}/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(12))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(2))
        }
    }

    @Test
    @TestSecurity(user = "sub-profile-content-viewer5")
    fun `returns second page with remaining items when 13 items exist`() {
        factory.createUserProfile("sub-profile-content-viewer5", "Viewer Five", "viewer5@example.com")
        val author = factory.createUserProfile("sub-paginate-target2", "Paginate Target Two", "paginate.target2@example.com")
        repeat(13) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/profiles/${author.slug}/content?page=1")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(1))
            body("pageIndex", equalTo(1))
            body("totalPages", equalTo(2))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/{slug}/content — defaults to page 0
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-profile-content-viewer6")
    fun `defaults to page 0 when no page parameter is provided`() {
        factory.createUserProfile("sub-profile-content-viewer6", "Viewer Six", "viewer6@example.com")
        val author = factory.createUserProfile("sub-default-page-target", "Default Page Target", "default.page.target@example.com")
        repeat(3) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/profiles/${author.slug}/content")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(3))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(1))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/{slug}/content — response includes authorName
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-profile-content-viewer7")
    fun `each content item includes authorName`() {
        factory.createUserProfile("sub-profile-content-viewer7", "Viewer Seven", "viewer7@example.com")
        val author = factory.createUserProfile("sub-author-target", "Willem Meints", "willem.target@example.com")
        factory.createPrompt(author, "My Prompt")

        When {
            get("/api/profiles/${author.slug}/content?page=0")
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
    // GET /api/profiles/{slug}/content — 404 for non-existent slug
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-profile-content-viewer8")
    fun `returns 404 when slug does not match any user`() {
        factory.createUserProfile("sub-profile-content-viewer8", "Viewer Eight", "viewer8@example.com")

        When {
            get("/api/profiles/nonexistent-user/content")
        } Then {
            statusCode(404)
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/profiles/{slug}/content — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `returns 401 when unauthenticated`() {
        When {
            get("/api/profiles/some-user/content")
        } Then {
            statusCode(401)
        }
    }
}
