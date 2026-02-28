package com.infosupport.promptyard.content

import jakarta.inject.Inject
import jakarta.ws.rs.DefaultValue
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response

@Path("/api/content")
class ContentItemsResource {

    @Inject
    lateinit var contentItemRepository: com.infosupport.promptyard.content.ContentItemRepository

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    fun getContentItems(@QueryParam("page") @DefaultValue("0") page: Int): Response {
        val query = contentItemRepository.findPaged(page)
        val totalPages = query.pageCount()
        val items = query.list().map { item ->
            _root_ide_package_.com.infosupport.promptyard.content.ContentItemResponse(
                slug = item.slug,
                title = item.title,
                description = item.description,
                tags = item.tags,
                contentType = item.contentType,
                author = ContentItemAuthorResponse(fullName = item.author.fullName),
                createdAt = item.createdAt.toString(),
                modifiedAt = item.modifiedAt?.toString()
            )
        }

        return Response.ok(
            _root_ide_package_.com.infosupport.promptyard.content.ContentItemPageResponse(
                items,
                page,
                totalPages
            )
        ).build()
    }
}
