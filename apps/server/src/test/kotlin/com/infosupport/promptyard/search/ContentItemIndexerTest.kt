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
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.opensearch.client.opensearch.OpenSearchClient

@QuarkusTest
class ContentItemIndexerTest {

    @Inject
    lateinit var factory: TestObjectFactory

    @Inject
    lateinit var contentItemRepository: ContentItemRepository

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var openSearchClient: OpenSearchClient

    @AfterEach
    @Transactional
    fun cleanUp() {
        contentItemRepository.deleteAll()
        userProfileRepository.deleteAll()
        try {
            openSearchClient.deleteByQuery { builder ->
                builder.index(CONTENT_ITEMS_INDEX)
                    .query { q -> q.matchAll { it } }
            }
        } catch (_: Exception) {
            // Index might not exist or be empty
        }
    }

    // -------------------------------------------------------------------------
    // SC-001 / SC-006: New prompt is indexed with correct fields and document ID
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-index-create-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Index Create User"),
        Claim(key = "email", value = "index.create@example.com")
    ])
    fun `new prompt is indexed in OpenSearch with correct fields`() {
        factory.createUserProfile("sub-index-create-user", "Index Create User", "index.create@example.com")

        val body = """{
            "title": "Indexed Prompt",
            "description": "A prompt to be indexed",
            "content": "Tell me about indexing",
            "tags": ["opensearch", "indexing"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(body)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
        }

        val contentItem = contentItemRepository.findBySlug("indexed-prompt")!!
        val docId = contentItem.id.toString()

        awaitIndexed(docId)

        val response = openSearchClient.get(
            { it.index(CONTENT_ITEMS_INDEX).id(docId) },
            ContentItemSearchDocument::class.java
        )

        assertTrue(response.found())
        val doc = response.source()!!
        assertEquals("indexed-prompt", doc.slug)
        assertEquals("prompt", doc.contentType)
        assertEquals("Tell me about indexing", doc.content)
        assertEquals("A prompt to be indexed", doc.description)
        assertEquals(listOf("opensearch", "indexing"), doc.tags)
        assertEquals("Index Create User", doc.authorFullName)
    }

    // -------------------------------------------------------------------------
    // SC-002: Updated prompt is re-indexed with new description
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-index-update-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Index Update User"),
        Claim(key = "email", value = "index.update@example.com")
    ])
    fun `updated prompt is re-indexed with new description`() {
        factory.createUserProfile("sub-index-update-user", "Index Update User", "index.update@example.com")

        val createBody = """{
            "title": "Update Index Prompt",
            "description": "Old description",
            "content": "Original content",
            "tags": ["original"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(createBody)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
        }

        val contentItem = contentItemRepository.findBySlug("update-index-prompt")!!
        val docId = contentItem.id.toString()

        awaitIndexed(docId)

        val updateBody = """{
            "title": "Update Index Prompt",
            "description": "New description",
            "content": "Updated content",
            "tags": ["updated"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(updateBody)
        } When {
            put("/api/content/prompts/update-index-prompt")
        } Then {
            statusCode(200)
        }

        awaitDocumentField(docId, "New description") { it.description }

        val response = openSearchClient.get(
            { it.index(CONTENT_ITEMS_INDEX).id(docId) },
            ContentItemSearchDocument::class.java
        )

        assertTrue(response.found())
        val doc = response.source()!!
        assertEquals("New description", doc.description)
        assertEquals("Updated content", doc.content)
        assertEquals(listOf("updated"), doc.tags)
    }

    // -------------------------------------------------------------------------
    // SC-003: Updated tags are reflected in the index
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-index-tags-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Index Tags User"),
        Claim(key = "email", value = "index.tags@example.com")
    ])
    fun `updated tags are reflected in the search index`() {
        factory.createUserProfile("sub-index-tags-user", "Index Tags User", "index.tags@example.com")

        val createBody = """{
            "title": "Tags Index Prompt",
            "description": "A prompt for tag testing",
            "content": "Content",
            "tags": ["kotlin"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(createBody)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
        }

        val contentItem = contentItemRepository.findBySlug("tags-index-prompt")!!
        val docId = contentItem.id.toString()

        awaitIndexed(docId)

        val updateBody = """{
            "title": "Tags Index Prompt",
            "description": "A prompt for tag testing",
            "content": "Content",
            "tags": ["kotlin", "quarkus"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(updateBody)
        } When {
            put("/api/content/prompts/tags-index-prompt")
        } Then {
            statusCode(200)
        }

        awaitDocumentField(docId, listOf("kotlin", "quarkus")) { it.tags }

        val response = openSearchClient.get(
            { it.index(CONTENT_ITEMS_INDEX).id(docId) },
            ContentItemSearchDocument::class.java
        )

        assertTrue(response.found())
        assertEquals(listOf("kotlin", "quarkus"), response.source()!!.tags)
    }

    // -------------------------------------------------------------------------
    // SC-004: Deleted prompt is removed from the index
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-index-delete-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Index Delete User"),
        Claim(key = "email", value = "index.delete@example.com")
    ])
    fun `deleted prompt is removed from the search index`() {
        factory.createUserProfile("sub-index-delete-user", "Index Delete User", "index.delete@example.com")

        val createBody = """{
            "title": "Delete Index Prompt",
            "description": "Will be deleted",
            "content": "Content to delete",
            "tags": ["delete"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(createBody)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
        }

        val contentItem = contentItemRepository.findBySlug("delete-index-prompt")!!
        val docId = contentItem.id.toString()

        awaitIndexed(docId)

        When {
            delete("/api/content/prompts/delete-index-prompt")
        } Then {
            statusCode(204)
        }

        awaitNotIndexed(docId)

        val response = openSearchClient.get(
            { it.index(CONTENT_ITEMS_INDEX).id(docId) },
            ContentItemSearchDocument::class.java
        )

        assertFalse(response.found())
    }

    // -------------------------------------------------------------------------
    // SC-005: Delete of non-existent document does not fail
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-index-delete-noop-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Index Delete Noop User"),
        Claim(key = "email", value = "index.delete.noop@example.com")
    ])
    fun `deleting a prompt not in the index does not cause an error`() {
        val profile = factory.createUserProfile("sub-index-delete-noop-user", "Index Delete Noop User", "index.delete.noop@example.com")

        // Create prompt via factory directly (bypasses the API, so no CREATED event is published)
        val prompt = factory.createPrompt(
            author = profile,
            title = "Noop Delete Prompt",
            description = "Not indexed",
            content = "Not indexed content",
            tags = listOf("noop"),
        )

        val docId = prompt.id.toString()

        // DELETE via API triggers a DELETED event for a document that doesn't exist in the index
        When {
            delete("/api/content/prompts/noop-delete-prompt")
        } Then {
            statusCode(204)
        }

        // Verify the document is still not in the index (delete of non-existent doc is a no-op)
        awaitNotIndexed(docId)
    }

    // -------------------------------------------------------------------------
    // EC-3: Rapid updates — index reflects the last update
    // -------------------------------------------------------------------------

    @Test
    @TestSecurity(user = "sub-index-rapid-update-user")
    @OidcSecurity(claims = [
        Claim(key = "name", value = "Index Rapid Update User"),
        Claim(key = "email", value = "index.rapid.update@example.com")
    ])
    fun `rapid successive updates result in the index reflecting the last update`() {
        factory.createUserProfile("sub-index-rapid-update-user", "Index Rapid Update User", "index.rapid.update@example.com")

        val createBody = """{
            "title": "Rapid Update Prompt",
            "description": "Initial description",
            "content": "Initial content",
            "tags": ["initial"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(createBody)
        } When {
            post("/api/content/prompts")
        } Then {
            statusCode(201)
        }

        val contentItem = contentItemRepository.findBySlug("rapid-update-prompt")!!
        val docId = contentItem.id.toString()

        awaitIndexed(docId)

        // Send two PUTs in quick succession without waiting between them
        val firstUpdateBody = """{
            "title": "Rapid Update Prompt",
            "description": "First update description",
            "content": "First update content",
            "tags": ["first"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(firstUpdateBody)
        } When {
            put("/api/content/prompts/rapid-update-prompt")
        } Then {
            statusCode(200)
        }

        val secondUpdateBody = """{
            "title": "Rapid Update Prompt",
            "description": "Second update description",
            "content": "Second update content",
            "tags": ["second", "final"]
        }"""

        Given {
            contentType(MediaType.APPLICATION_JSON)
            body(secondUpdateBody)
        } When {
            put("/api/content/prompts/rapid-update-prompt")
        } Then {
            statusCode(200)
        }

        // Wait for the index to reflect the second (last) update
        awaitDocumentField(docId, "Second update description") { it.description }

        val response = openSearchClient.get(
            { it.index(CONTENT_ITEMS_INDEX).id(docId) },
            ContentItemSearchDocument::class.java
        )

        assertTrue(response.found())
        val doc = response.source()!!
        assertEquals("Second update description", doc.description)
        assertEquals("Second update content", doc.content)
        assertEquals(listOf("second", "final"), doc.tags)
    }

    // -------------------------------------------------------------------------
    // Polling helpers for eventual consistency
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

    private fun awaitNotIndexed(id: String, timeoutMs: Long = 5000) {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < deadline) {
            try {
                val response = openSearchClient.get(
                    { it.index(CONTENT_ITEMS_INDEX).id(id) },
                    ContentItemSearchDocument::class.java
                )
                if (!response.found()) return
            } catch (_: Exception) {
                return
            }
            Thread.sleep(200)
        }
        throw AssertionError("Document $id still found in index after ${timeoutMs}ms")
    }

    private fun <T> awaitDocumentField(id: String, expected: T, timeoutMs: Long = 5000, extractor: (ContentItemSearchDocument) -> T) {
        val deadline = System.currentTimeMillis() + timeoutMs
        while (System.currentTimeMillis() < deadline) {
            try {
                val response = openSearchClient.get(
                    { it.index(CONTENT_ITEMS_INDEX).id(id) },
                    ContentItemSearchDocument::class.java
                )
                if (response.found() && extractor(response.source()!!) == expected) return
            } catch (_: Exception) {
                // Not ready yet
            }
            Thread.sleep(200)
        }
        throw AssertionError("Document $id field did not reach expected value $expected within ${timeoutMs}ms")
    }
}
