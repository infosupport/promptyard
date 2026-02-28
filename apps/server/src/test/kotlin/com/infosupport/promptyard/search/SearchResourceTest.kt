package com.infosupport.promptyard.search

import com.infosupport.promptyard.content.ContentItemRepository
import com.infosupport.promptyard.content.TestObjectFactory
import com.infosupport.promptyard.profiles.UserProfileRepository
import io.quarkus.test.junit.QuarkusTest
import io.quarkus.test.security.TestSecurity
import io.quarkus.test.security.oidc.Claim
import io.quarkus.test.security.oidc.OidcSecurity
import io.restassured.module.kotlin.extensions.Given
import io.restassured.module.kotlin.extensions.Then
import io.restassured.module.kotlin.extensions.When
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.core.MediaType
import org.hamcrest.Matchers.equalTo
import org.hamcrest.Matchers.greaterThanOrEqualTo
import org.hamcrest.Matchers.hasSize
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.opensearch.client.opensearch.OpenSearchClient

@QuarkusTest
class SearchResourceTest {

    @Inject
    lateinit var factory: TestObjectFactory

    @Inject
    lateinit var contentItemRepository: ContentItemRepository

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var openSearchClient: OpenSearchClient

    @BeforeEach
    fun clearIndex() {
        try {
            openSearchClient.indices().refresh { it.index(CONTENT_ITEMS_INDEX) }
            openSearchClient.deleteByQuery { builder ->
                builder.index(CONTENT_ITEMS_INDEX)
                    .query { q -> q.matchAll { it } }
            }
            openSearchClient.indices().refresh { it.index(CONTENT_ITEMS_INDEX) }
        } catch (_: Exception) {
            // Index might not exist or be empty
        }
    }

    @AfterEach
    @Transactional
    fun cleanUp() {
        contentItemRepository.deleteAll()
        userProfileRepository.deleteAll()
    }

    // -------------------------------------------------------------------------
    // Search returns matching results
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-search-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search User"),
        Claim(key = "email", value = "search@example.com")
    ])
    fun `search returns matching results`() {
        factory.createUserProfile("sub-search-user", "Search User", "search@example.com")

        // Create a prompt via the API to trigger indexing
        Given {
            contentType(MediaType.APPLICATION_JSON)
            body("""{
                "title": "Kotlin Best Practices",
                "description": "A guide to writing good Kotlin code",
                "content": "Use val instead of var",
                "tags": ["kotlin", "best-practices"]
            }""")
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
        }

        val contentItem = contentItemRepository.findBySlug("kotlin-best-practices")!!
        awaitIndexed(contentItem.id.toString())

        // Refresh the index to make the document searchable
        refreshIndex()

        When {
            get("/api/search?q=kotlin")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(1))
            body("items[0].slug", equalTo("kotlin-best-practices"))
            body("items[0].title", equalTo("Kotlin Best Practices"))
            body("items[0].description", equalTo("A guide to writing good Kotlin code"))
            body("items[0].contentType", equalTo("prompt"))
            body("items[0].author.fullName", equalTo("Search User"))
            body("items[0].author.slug", equalTo("search-user"))
            body("items[0].createdAt", notNullValue())
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(1))
        }
    }

    // -------------------------------------------------------------------------
    // Search returns paginated results
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-search-page-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search Page User"),
        Claim(key = "email", value = "search.page@example.com")
    ])
    fun `search returns paginated results`() {
        factory.createUserProfile("sub-search-page-user", "Search Page User", "search.page@example.com")

        // Create 14 prompts to span 2 pages (page size = 12)
        for (i in 1..14) {
            Given {
                contentType(MediaType.APPLICATION_JSON)
                body("""{
                    "title": "Pagination Prompt $i",
                    "description": "Description for pagination test $i",
                    "content": "Content about pagination topic $i",
                    "tags": ["pagination"]
                }""")
            } When {
                post("/api/content/prompts")
            } Then {
                statusCode(201)
            }
        }

        // Wait for all documents to be indexed
        val items = contentItemRepository.listAll()
        for (item in items) {
            awaitIndexed(item.id.toString())
        }

        refreshIndex()

        // Page 1 should have 12 items
        When {
            get("/api/search?q=pagination&page=0")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(12))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(2))
        }

        // Page 2 should have 2 items
        When {
            get("/api/search?q=pagination&page=1")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(2))
            body("pageIndex", equalTo(1))
            body("totalPages", equalTo(2))
        }
    }

    // -------------------------------------------------------------------------
    // Unauthenticated request returns 302
    // -------------------------------------------------------------------------

    @Test
    fun `unauthenticated request returns 401`() {
        When {
            get("/api/search?q=test")
        } Then {
            statusCode(401)
        }
    }

    // -------------------------------------------------------------------------
    // Empty query returns empty results
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-search-empty-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search Empty User"),
        Claim(key = "email", value = "search.empty@example.com")
    ])
    fun `empty query returns empty results`() {
        When {
            get("/api/search?q=")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(0))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(0))
        }
    }

    @Test
    @TestSecurity(user = "sub-search-missing-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search Missing User"),
        Claim(key = "email", value = "search.missing@example.com")
    ])
    fun `missing query returns empty results`() {
        When {
            get("/api/search")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(0))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(0))
        }
    }

    @Test
    @TestSecurity(user = "sub-search-whitespace-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search Whitespace User"),
        Claim(key = "email", value = "search.whitespace@example.com")
    ])
    fun `whitespace-only query returns empty results`() {
        When {
            get("/api/search?q=%20%20%20")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(0))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(0))
        }
    }

    // -------------------------------------------------------------------------
    // No matching results returns empty page
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-search-nomatch-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search NoMatch User"),
        Claim(key = "email", value = "search.nomatch@example.com")
    ])
    fun `query with no matches returns empty results`() {
        refreshIndex()

        When {
            get("/api/search?q=xyznonexistent")
        } Then {
            statusCode(200)
            body("items", hasSize<Any>(0))
            body("pageIndex", equalTo(0))
            body("totalPages", equalTo(0))
        }
    }

    // -------------------------------------------------------------------------
    // Query exceeding max length returns 400
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-search-long-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search Long User"),
        Claim(key = "email", value = "search.long@example.com")
    ])
    fun `query exceeding max length returns 400`() {
        val longQuery = "a".repeat(1001)

        When {
            get("/api/search?q=$longQuery")
        } Then {
            statusCode(400)
        }
    }

    // -------------------------------------------------------------------------
    // Negative page is treated as page 0
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-search-negpage-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Search NegPage User"),
        Claim(key = "email", value = "search.negpage@example.com")
    ])
    fun `negative page parameter is treated as page 0`() {
        refreshIndex()

        When {
            get("/api/search?q=test&page=-1")
        } Then {
            statusCode(200)
            body("pageIndex", equalTo(0))
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private fun awaitIndexed(id: String, timeoutMs: Long = 5000) {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < deadline) {
            try {
                val response = openSearchClient.get(
                    { it.index(CONTENT_ITEMS_INDEX).id(id) },
                    ContentItemSearchDocument::class.java
                )
                if (response.found()) return
            } catch (_: Exception) {
                // Index might not be ready yet
            }
            Thread.sleep(200)
        }
        throw AssertionError("Document $id not found in index within ${timeoutMs}ms")
    }

    private fun refreshIndex() {
        try {
            openSearchClient.indices().refresh { it.index(CONTENT_ITEMS_INDEX) }
        } catch (_: Exception) {
            // Index might not exist
        }
    }
}
