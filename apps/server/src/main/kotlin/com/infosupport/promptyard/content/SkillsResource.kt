package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfileRepository
import com.infosupport.promptyard.search.ContentItemEvent
import com.infosupport.promptyard.search.ContentItemEventType
import io.quarkus.security.identity.SecurityIdentity
import io.vertx.mutiny.core.eventbus.EventBus
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import java.net.URI
import java.time.Instant

@Path("/api/content/skills")
class SkillsResource {

    @Inject
    lateinit var identity: SecurityIdentity

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var contentItemSlugGenerator: ContentItemSlugGenerator

    @Inject
    lateinit var contentItemRepository: ContentItemRepository

    @Inject
    lateinit var skillRepository: SkillRepository

    @Inject
    lateinit var skillService: SkillService

    @Inject
    lateinit var eventBus: EventBus

    @GET
    @Path("/{slug}")
    @Produces(MediaType.APPLICATION_JSON)
    fun getSkillBySlug(@PathParam("slug") slug: String): Response {
        val contentItem = contentItemRepository.findBySlug(slug)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        if (contentItem.contentType != "skill") {
            return Response.status(Response.Status.NOT_FOUND).build()
        }

        val skill = contentItem as Skill
        val author = skill.author

        val subjectName = identity.principal.name
        val isOwner = author.subjectName == subjectName

        // Parse file metadata from JSON string to list of SkillFileResponse
        // For now, we'll return a placeholder list based on fileCount
        val files = (0 until skill.fileCount).map { index ->
            SkillFileResponse(
                fileName = "file_$index", // Placeholder
                fileSize = skill.fileSize / skill.fileCount,
                isTextFile = true // Placeholder
            )
        }

        val response = SkillDetailResponse(
            title = skill.title,
            slug = skill.slug,
            description = skill.description,
            tags = skill.tags,
            contentType = "skill",
            createdAt = skill.createdAt.toString(),
            modifiedAt = skill.modifiedAt?.toString(),
            author = AuthorSummary(
                fullName = author.fullName,
                jobTitle = author.jobTitle,
                profileSlug = author.slug,
                promptCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "prompt"),
                skillCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "skill"),
                agentCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "agent"),
                workflowCount = contentItemRepository.countByAuthorIdAndContentType(author.id!!, "workflow"),
            ),
            isOwner = isOwner,
            fileCount = skill.fileCount,
            fileSize = skill.fileSize,
            files = files,
            previewContent = skill.previewContent
        )

        return Response.ok(response).build()
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun submitSkill(request: SubmitSkillRequest): Response {
        val subjectName = identity.principal.name

        val userProfile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        // Validate the zip file
        val errors = skillService.validateZipFile(request.fileSize, request.fileMetadata)
        if (errors.isNotEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(mapOf("error" to errors.joinToString("; ")))
                .build()
        }

        val slug = contentItemSlugGenerator.generateSlug(request.title, "skill")

        val skill = Skill().apply {
            this.title = request.title
            this.description = request.description
            this.tags = request.tags
            this.slug = slug
            this.authorId = userProfile.id!!
            this.createdAt = Instant.now()
            this.fileCount = 0 // Will be set from metadata
            this.fileSize = request.fileSize
            this.fileMetadata = request.fileMetadata
            this.previewContent = request.previewContent
        }

        contentItemRepository.persist(skill)

        eventBus.publish("content-item.changed", ContentItemEvent(
            contentItemId = skill.id!!,
            eventType = ContentItemEventType.CREATED,
            contentType = "skill",
            slug = skill.slug,
            title = skill.title,
            content = skill.previewContent ?: "",
            description = skill.description,
            tags = skill.tags,
            authorFullName = userProfile.fullName,
            authorSlug = userProfile.slug,
            createdAt = skill.createdAt,
            modifiedAt = skill.modifiedAt,
        ))

        return Response
            .created(URI.create("/api/content/skills/${skill.slug}"))
            .entity(SubmitSkillResponse(slug = skill.slug))
            .build()
    }
}
