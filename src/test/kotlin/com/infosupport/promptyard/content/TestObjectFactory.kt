package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfile
import com.infosupport.promptyard.profiles.UserProfileRepository
import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject
import jakarta.transaction.Transactional
import java.time.Instant

@ApplicationScoped
class TestObjectFactory {

    @Inject
    lateinit var contentItemRepository: com.infosupport.promptyard.content.ContentItemRepository

    @Inject
    lateinit var userProfileRepository: com.infosupport.promptyard.profiles.UserProfileRepository

    @Transactional
    fun createUserProfile(
        subjectName: String,
        fullName: String,
        emailAddress: String,
        privacyAcceptedAt: Instant? = Instant.now(),
        jobTitle: String? = null,
    ): com.infosupport.promptyard.profiles.UserProfile {
        val profile = _root_ide_package_.com.infosupport.promptyard.profiles.UserProfile().apply {
            this.subjectName = subjectName
            this.slug = fullName.lowercase().trim().replace(Regex("\\s+"), "-")
            this.fullName = fullName
            this.emailAddress = emailAddress
            this.privacyAcceptedAt = privacyAcceptedAt
            this.jobTitle = jobTitle
            this.createdAt = Instant.now()
        }
        userProfileRepository.persist(profile)
        return profile
    }

    @Transactional
    fun createPrompt(
        author: com.infosupport.promptyard.profiles.UserProfile,
        title: String,
        tags: List<String> = emptyList(),
        description: String = "Description for $title",
        content: String = "Content for $title",
        createdAt: Instant = Instant.now(),
    ): com.infosupport.promptyard.content.Prompt {
        val prompt = _root_ide_package_.com.infosupport.promptyard.content.Prompt().apply {
            this.title = title
            this.slug = title.lowercase().trim().replace(Regex("\\s+"), "-")
            this.description = description
            this.tags = tags
            this.content = content
            this.authorId = author.id!!
            this.createdAt = createdAt
        }
        contentItemRepository.persist(prompt)
        return prompt
    }
}
