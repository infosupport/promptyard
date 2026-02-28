package com.infosupport.promptyard.profiles

import com.infosupport.promptyard.content.ContentItemRepository
import io.quarkus.oidc.IdToken
import io.quarkus.security.identity.SecurityIdentity
import jakarta.transaction.Transactional
import jakarta.ws.rs.Consumes
import jakarta.ws.rs.DefaultValue
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.PUT
import jakarta.ws.rs.Path
import jakarta.ws.rs.PathParam
import jakarta.ws.rs.Produces
import jakarta.ws.rs.QueryParam
import jakarta.ws.rs.core.MediaType
import jakarta.ws.rs.core.Response
import kotlinx.serialization.Serializable
import org.eclipse.microprofile.jwt.JsonWebToken
import java.net.URI
import java.time.Instant
import jakarta.inject.Inject

@Serializable
private data class ErrorResponse(val error: String)

@Path("/api/profiles")
class UserProfilesResource {

    @Inject
    lateinit var identity: SecurityIdentity

    @Inject
    @IdToken
    lateinit var idToken: JsonWebToken

    @Inject
    lateinit var slugGenerator: UserProfileSlugGenerator

    @Inject
    lateinit var userProfileRepository: UserProfileRepository

    @Inject
    lateinit var contentItemRepository: ContentItemRepository

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    fun onboardUser(request: com.infosupport.promptyard.profiles.OnboardUserRequest): Response {
        val subjectName = identity.principal.name
        val fullName = idToken.getClaim<String>("name") ?: identity.principal.name
        val emailAddress = idToken.getClaim<String>("email") ?: ""
        val existing = userProfileRepository.findBySubjectName(subjectName)

        if (existing != null) {
            return Response.ok(_root_ide_package_.com.infosupport.promptyard.profiles.OnboardUserResponse(existing.slug)).build()
        }

        if (!request.privacyAccepted) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(ErrorResponse("Privacy statement must be accepted"))
                .build()
        }

        val slug = slugGenerator.generateSlug(fullName)

        val profile = _root_ide_package_.com.infosupport.promptyard.profiles.UserProfile().apply {
            this.subjectName = subjectName
            this.slug = slug
            this.fullName = fullName
            this.emailAddress = emailAddress
            this.jobTitle = request.jobTitle
            this.businessUnit = request.businessUnit
            this.privacyAcceptedAt = Instant.now()
            this.createdAt = Instant.now()
        }

        userProfileRepository.persist(profile)

        return Response
            .created(URI.create("/api/profiles/${profile.slug}"))
            .entity(_root_ide_package_.com.infosupport.promptyard.profiles.OnboardUserResponse(profile.slug))
            .build()
    }

    @PUT
    @Path("/me")
    @Consumes(MediaType.APPLICATION_JSON)
    @Transactional
    fun updateCurrentUserProfile(request: com.infosupport.promptyard.profiles.UpdateProfileRequest): Response {
        val subjectName = identity.principal.name
        val profile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        profile.jobTitle = request.jobTitle
        profile.businessUnit = request.businessUnit
        profile.modifiedAt = Instant.now()

        return Response.accepted().build()
    }

    @GET
    @Path("/me")
    @Produces(MediaType.APPLICATION_JSON)
    fun getCurrentUserProfile(): Response {
        val subjectName = identity.principal.name
        val profile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        return Response.ok(
            _root_ide_package_.com.infosupport.promptyard.profiles.UserProfileResponse(
                id = profile.id,
                slug = profile.slug,
                fullName = profile.fullName,
                emailAddress = profile.emailAddress,
                businessUnit = profile.businessUnit,
                jobTitle = profile.jobTitle,
                privacyAcceptedAt = profile.privacyAcceptedAt?.toString(),
                createdAt = profile.createdAt.toString(),
                modifiedAt = profile.modifiedAt?.toString()
            )
        ).build()
    }

    @GET
    @Path("/me/content")
    @Produces(MediaType.APPLICATION_JSON)
    fun getMyContent(@QueryParam("page") @DefaultValue("0") page: Int): Response {
        val subjectName = identity.principal.name
        val profile = userProfileRepository.findBySubjectName(subjectName)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        return buildContentPageResponse(profile, page)
    }

    @GET
    @Path("/{slug}/content")
    @Produces(MediaType.APPLICATION_JSON)
    fun getProfileContent(
        @PathParam("slug") slug: String,
        @QueryParam("page") @DefaultValue("0") page: Int
    ): Response {
        val profile = userProfileRepository.findBySlug(slug)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        return buildContentPageResponse(profile, page)
    }

    private fun buildContentPageResponse(profile: UserProfile, page: Int): Response {
        val query = contentItemRepository.findPagedByAuthorId(profile.id!!, page)
        val totalPages = query.pageCount()
        val items = query.list().map { item ->
            MyContentItemResponse(
                slug = item.slug,
                title = item.title,
                description = item.description,
                tags = item.tags,
                contentType = item.contentType,
                authorName = profile.fullName,
                createdAt = item.createdAt.toString(),
                modifiedAt = item.modifiedAt?.toString()
            )
        }

        return Response.ok(MyContentPageResponse(items, page, totalPages)).build()
    }

    @GET
    @Path("/{slug}")
    @Produces(MediaType.APPLICATION_JSON)
    fun getUserProfile(@PathParam("slug") slug: String): Response {
        val profile = userProfileRepository.findBySlug(slug)
            ?: return Response.status(Response.Status.NOT_FOUND).build()

        return Response.ok(
            _root_ide_package_.com.infosupport.promptyard.profiles.UserProfileResponse(
                id = profile.id,
                slug = profile.slug,
                fullName = profile.fullName,
                emailAddress = profile.emailAddress,
                businessUnit = profile.businessUnit,
                jobTitle = profile.jobTitle,
                privacyAcceptedAt = profile.privacyAcceptedAt?.toString(),
                createdAt = profile.createdAt.toString(),
                modifiedAt = profile.modifiedAt?.toString()
            )
        ).build()
    }


}