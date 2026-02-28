package com.infosupport.promptyard.profiles

import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject

@ApplicationScoped
class UserProfileSlugGenerator {

    @Inject
    lateinit var repository: com.infosupport.promptyard.profiles.UserProfileRepository

    fun generateSlug(fullName: String): String {
        val baseSlug = fullName
            .lowercase()
            .trim()
            .replace(Regex("[^a-z0-9\\s-]"), "")
            .replace(Regex("\\s+"), "-")
            .replace(Regex("-{2,}"), "-")

        if (!repository.existsBySlug(baseSlug)) {
            return baseSlug
        }

        var counter = 2

        while (true) {
            val candidate = "$baseSlug-$counter"
            if (!repository.existsBySlug(candidate)) {
                return candidate
            }
            counter++
        }
    }
}
