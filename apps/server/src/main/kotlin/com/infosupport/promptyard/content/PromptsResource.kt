package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfileRepository
import io.quarkus.security.identity.SecurityIdentity
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.DELETE
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.PUT
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import java.net.URI
import java.time.Instant

@Path("/api/content/prompts")
class PromptsResource {

    @Inject
    lateinit var identity: SecurityIdentity

    @Inject
    lateinit var userProfileRepository: com.infosupport.promptyard.profiles.UserProfileRepository

    @Inject
    lateinit var contentItemSlugGenerator: com.infosupport.promptyard.content.ContentItemSlugGenerator

    @Inject
    lateinit var contentItemRepository: com.infosupport.promptyard.content.ContentItemRepository

    @GET
    @Path("/{slug}")
    @Produces(MediaType.APPLICATION_JSON)
    fun getPromptBySlug(@PathParam("slug") slug: String): Response {
        val contentItem = contentItemRepository.findBySlug(slug)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        if (contentItem.contentType != "prompt") {
            return Response.status(Response.Status.NOT_FOUND).build()
        }

        val prompt = contentItem as Prompt
        val author = prompt.author

        val authorSummary = AuthorSummary(
            fullName = author.fullName,
            jobTitle = author.jobTitle,
            profileSlug = author.slug,
            promptCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "prompt"),
            skillCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "skill"),
            agentCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "agent"),
            workflowCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "workflow"),
        )

        val subjectName = identity.principal.name
        val isOwner = author.subjectName == subjectName

        val response = PromptDetailResponse(
            title = prompt.title,
            slug = prompt.slug,
            description = prompt.description,
            content = prompt.content,
            tags = prompt.tags,
            contentType = "prompt",
            createdAt = prompt.createdAt.toString(),
            modifiedAt = prompt.modifiedAt?.toString(),
            author = authorSummary,
            isOwner = isOwner,
        )

        return Response.ok(response).build()
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun submitPrompt(request: com.infosupport.promptyard.content.SubmitPromptRequest): Response {
        val subjectName = identity.principal.name

        val userProfile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        val slug = contentItemSlugGenerator.generateSlug(request.title, "prompt")

        val prompt = _root_ide_package_.com.infosupport.promptyard.content.Prompt().apply {
            this.title = request.title
            this.description = request.description
            this.content = request.content
            this.tags = request.tags
            this.slug = slug
            this.authorId = userProfile.id!!
            this.createdAt = Instant.now()
        }

        contentItemRepository.persist(prompt)

        return Response
            .created(URI.create("/api/content/prompts/${prompt.slug}"))
            .entity(_root_ide_package_.com.infosupport.promptyard.content.SubmitPromptResponse(slug = prompt.slug))
            .build()
    }

    @PUT
    @Path("/{slug}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun updatePrompt(@PathParam("slug") slug: String, request: UpdatePromptRequest): Response {
        val subjectName = identity.principal.name

        val userProfile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        val contentItem = contentItemRepository.findBySlug(slug)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        if (contentItem.contentType != "prompt") {
            return Response.status(Response.Status.NOT_FOUND).build()
        }

        if (contentItem.authorId != userProfile.id) {
            return Response.status(Response.Status.FORBIDDEN).build()
        }

        val prompt = contentItem as Prompt
        prompt.title = request.title
        prompt.description = request.description
        prompt.content = request.content
        prompt.tags = request.tags
        prompt.modifiedAt = Instant.now()

        return Response.ok(UpdatePromptResponse(slug = prompt.slug)).build()
    }

    @DELETE
    @Path("/{slug}")
    @Transactional
    fun deletePrompt(@PathParam("slug") slug: String): Response {
        val subjectName = identity.principal.name

        val userProfile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        val prompt = contentItemRepository.findBySlug(slug)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        if (prompt.contentType != "prompt") {
            return Response.status(Response.Status.NOT_FOUND).build()
        }

        if (prompt.authorId != userProfile.id) {
            return Response.status(Response.Status.FORBIDDEN).build()
        }

        contentItemRepository.delete(prompt)

        return Response.noContent().build()
    }

}
