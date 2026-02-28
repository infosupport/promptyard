package com.infosupport.promptyard.search

import com.infosupport.promptyard.content.ContentItemAuthorResponse
import com.infosupport.promptyard.content.ContentItemPageResponse
import com.infosupport.promptyard.content.ContentItemResponse
import jakarta.inject.Inject
import jakarta.ws.rs.DefaultValue
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import org.opensearch.client.opensearch.OpenSearchClient
import org.opensearch.client.opensearch.core.SearchRequest
import org.jboss.logging.Logger
import kotlin.math.ceil
import kotlin.math.max

@Path("/api/search")
class SearchResource {

    @Inject
    lateinit var client: OpenSearchClient

    private val log = Logger.getLogger(SearchResource::class.java)

    companion object {
        const val PAGE_SIZE = 12
        const val MAX_QUERY_LENGTH = 1000
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    fun search(
        @QueryParam("q") query: String?,
        @QueryParam("page") @DefaultValue("0") page: Int,
    ): Response {
        val trimmedQuery = query?.trim()

        if (trimmedQuery.isNullOrEmpty()) {
            return Response.ok(ContentItemPageResponse(items = emptyList(), pageIndex = 0, totalPages = 0, totalItems = 0)).build()
        }

        if (trimmedQuery.length > MAX_QUERY_LENGTH) {
            return Response.status(Response.Status.BAD_REQUEST).build()
        }

        val pageIndex = max(0, page)

        return try {
            val searchRequest = SearchRequest.Builder()
                .index(CONTENT_ITEMS_INDEX)
                .query { q ->
                    q.multiMatch { mm ->
                        mm.query(trimmedQuery)
                            .fields("title", "content", "description", "tags", "authorFullName")
                    }
                }
                .from(pageIndex * PAGE_SIZE)
                .size(PAGE_SIZE)
                .build()

            val searchResponse = client.search(searchRequest, ContentItemSearchDocument::class.java)

            val totalHits = searchResponse.hits().total()?.value() ?: 0
            val totalPages = if (totalHits == 0L) 0 else ceil(totalHits.toDouble() / PAGE_SIZE).toInt()

            val items = searchResponse.hits().hits().mapNotNull { hit ->
                val doc = hit.source() ?: return@mapNotNull null
                ContentItemResponse(
                    slug = doc.slug,
                    title = doc.title,
                    description = doc.description ?: "",
                    tags = doc.tags,
                    contentType = doc.contentType,
                    author = ContentItemAuthorResponse(
                        fullName = doc.authorFullName,
                        slug = doc.authorSlug,
                    ),
                    createdAt = doc.createdAt.toString(),
                    modifiedAt = doc.modifiedAt?.toString(),
                )
            }

            Response.ok(ContentItemPageResponse(items = items, pageIndex = pageIndex, totalPages = totalPages, totalItems = totalHits)).build()
        } catch (e: Exception) {
            log.error("Search request failed", e)
            Response.status(Response.Status.SERVICE_UNAVAILABLE).build()
        }
    }
}
