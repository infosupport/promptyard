package com.infosupport.promptyard.search

import io.quarkus.runtime.StartupEvent
import jakarta.enterprise.context.ApplicationScoped
import jakarta.enterprise.event.Observes
import jakarta.inject.Inject
import org.opensearch.client.opensearch.OpenSearchClient
import org.opensearch.client.opensearch._types.mapping.KeywordProperty
import org.opensearch.client.opensearch._types.mapping.Property
import org.opensearch.client.opensearch._types.mapping.TextProperty
import org.jboss.logging.Logger

@ApplicationScoped
class ContentItemIndexInitializer {

    @Inject
    lateinit var client: OpenSearchClient

    private val log = Logger.getLogger(ContentItemIndexInitializer::class.java)

    fun onStartup(@Observes event: StartupEvent) {
        try {
            val exists = client.indices().exists { it.index(CONTENT_ITEMS_INDEX) }.value()
            if (!exists) {
                client.indices().create { builder ->
                    builder.index(CONTENT_ITEMS_INDEX)
                        .mappings { m ->
                            m.properties("slug", Property.of { p -> p.keyword(KeywordProperty.of { it }) })
                                .properties("contentType", Property.of { p -> p.keyword(KeywordProperty.of { it }) })
                                .properties("content", Property.of { p -> p.text(TextProperty.of { it }) })
                                .properties("description", Property.of { p -> p.text(TextProperty.of { it }) })
                                .properties("tags", Property.of { p -> p.keyword(KeywordProperty.of { it }) })
                                .properties("authorFullName", Property.of { p ->
                                    p.text(TextProperty.of { t ->
                                        t.fields("keyword", Property.of { f ->
                                            f.keyword(KeywordProperty.of { it })
                                        })
                                    })
                                })
                        }
                }
                log.info("Created OpenSearch index '$CONTENT_ITEMS_INDEX'")
            } else {
                log.info("OpenSearch index '$CONTENT_ITEMS_INDEX' already exists")
            }
        } catch (e: Exception) {
            log.warn("Failed to initialize OpenSearch index '$CONTENT_ITEMS_INDEX'", e)
        }
    }
}
