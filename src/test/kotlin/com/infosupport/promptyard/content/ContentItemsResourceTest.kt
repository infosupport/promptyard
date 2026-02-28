package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfileRepository
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

@QuarkusTest
class ContentItemsResourceTest {

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
    // GET /api/content — authenticated, no items
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-list-user")
    fun `returns 200 with empty list when no content exists`() {
        When {
            get("/api/content")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(0))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(1))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content — authenticated, authorName in response
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-list-user")
    fun `returns author with fullName for each content item`() {
        val author = factory.createUserProfile("sub-list-user", "List User", "list.user@example.com")
        factory.createPrompt(author, "My Prompt")

        When {
            get("/api/content")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(1))
            body("items[0].author.fullName", equalTo("List User"))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content — authenticated, first page
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-list-user")
    fun `returns first page of 12 items when 13 items exist`() {
        val author = factory.createUserProfile("sub-list-user", "List User", "list.user@example.com")
        repeat(13) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/content?page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(12))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(2))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content — authenticated, second page
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-list-user")
    fun `returns second page with remaining items when 13 items exist`() {
        val author = factory.createUserProfile("sub-list-user", "List User", "list.user@example.com")
        repeat(13) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/content?page=1")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(1))
            body("pageIndex", equalTo(1))
            body("totalPages", equalTo(2))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content — authenticated, defaults to page 0
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-list-user")
    fun `defaults to page 0 when no page parameter is provided`() {
        val author = factory.createUserProfile("sub-list-user", "List User", "list.user@example.com")
        repeat(5) { i -> factory.createPrompt(author, "Prompt $i") }

        When {
            get("/api/content")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(5))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(1))
        }
    }

    // -------------------------------------------------------------------------
    // GET /api/content — unauthenticated
    // -------------------------------------------------------------------------

    @Test
    fun `redirects to login when no authentication is provided`() {
        Given {
            redirects().follow(false)
        } When {
            get("/api/content")
        } Then {
            statusCode(302)
        }
    }
}
