package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfileRepository
import io.quarkus.security.identity.SecurityIdentity
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.NotFoundException
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import java.net.URI
import java.time.Instant

@Path("/api/content/prompts/{slug}/comments")
class CommentsResource {

    @Inject
    lateinit var identity: SecurityIdentity

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var contentItemRepository: ContentItemRepository

    @Inject
    lateinit var commentRepository: CommentRepository

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    fun getComments(@PathParam("slug") slug: String): List<CommentResponse> {
        val contentItem = contentItemRepository.findBySlug(slug)
            ?: throw NotFoundException()

        if (contentItem.contentType != "prompt") {
            throw NotFoundException()
        }

        val comments = commentRepository.findByContentItemId(contentItem.id!!)

        return comments.map { comment ->
            CommentResponse(
                id = comment.id!!,
                text = comment.text,
                createdAt = comment.createdAt.toString(),
                authorFullName = comment.author.fullName
            )
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun createComment(@PathParam("slug") slug: String, request: CreateCommentRequest): Response {
        if (request.text.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build()
        }

        val contentItem = contentItemRepository.findBySlug(slug)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        if (contentItem.contentType != "prompt") {
            return Response.status(Response.Status.NOT_FOUND).build()
        }

        val subjectName = identity.principal.name

        val userProfile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        val comment = Comment().apply {
            this.text = request.text
            this.createdAt = Instant.now()
            this.authorId = userProfile.id!!
            this.contentItemId = contentItem.id!!
        }

        commentRepository.persist(comment)

        val response = CommentResponse(
            id = comment.id!!,
            text = comment.text,
            createdAt = comment.createdAt.toString(),
            authorFullName = userProfile.fullName
        )

        return Response
            .created(URI.create("/api/content/prompts/$slug/comments"))
            .entity(response)
            .build()
    }
}
