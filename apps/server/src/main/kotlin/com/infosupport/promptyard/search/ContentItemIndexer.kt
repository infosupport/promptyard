package com.infosupport.promptyard.search

import io.quarkus.vertx.ConsumeEvent
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import org.opensearch.client.opensearch.OpenSearchClient
import org.jboss.logging.Logger

@ApplicationScoped
class ContentItemIndexer {

    @Inject
    lateinit var client: OpenSearchClient

    private val log = Logger.getLogger(ContentItemIndexer::class.java)

    @ConsumeEvent(value = "content-item.changed", blocking = true)
    fun onContentItemChanged(event: ContentItemEvent) {
        try {
            when (event.eventType) {
                ContentItemEventType.CREATED, ContentItemEventType.UPDATED -> indexDocument(event)
                ContentItemEventType.DELETED -> deleteDocument(event)
            }
        } catch (e: Exception) {
            log.warn(
                "Failed to process search index event: " +
                    "contentItemId=${event.contentItemId}, eventType=${event.eventType}",
                e
            )
        }
    }

    private fun indexDocument(event: ContentItemEvent) {
        val document = ContentItemSearchDocument(
            slug = requireNotNull(event.slug) { "slug is required for ${event.eventType} event" },
            contentType = event.contentType,
            content = event.content,
            description = event.description,
            tags = event.tags ?: emptyList(),
            authorFullName = requireNotNull(event.authorFullName) { "authorFullName is required for ${event.eventType} event" },
        )

        client.index { builder ->
            builder
                .index(CONTENT_ITEMS_INDEX)
                .id(event.contentItemId.toString())
                .document(document)
        }

        log.debug("Indexed content item ${event.contentItemId} in search index")
    }

    private fun deleteDocument(event: ContentItemEvent) {
        client.delete { builder ->
            builder
                .index(CONTENT_ITEMS_INDEX)
                .id(event.contentItemId.toString())
        }

        log.debug("Deleted content item ${event.contentItemId} from search index")
    }
}
