package com.infosupport.promptyard.content

import jakarta.enterprise.context.ApplicationScoped
import jakarta.inject.Inject

@ApplicationScoped
class ContentItemSlugGenerator {
    @Inject
    lateinit var repository: com.infosupport.promptyard.content.ContentItemRepository

    fun generateSlug(title: String, contentType: String): String {
        val baseSlug = title
            .lowercase()
            .trim()
            .replace(Regex("[^a-z0-9\\s-]"), "")
            .replace(Regex("\\s+"), "-")
            .replace(Regex("-{2,}"), "-")

        if (!repository.existsBySlugAndContentType(baseSlug, contentType)) {
            return baseSlug
        }

        var counter = 2

        while (true) {
            val candidate = "$baseSlug-$counter"
            if (!repository.existsBySlugAndContentType(candidate, contentType)) {
                return candidate
            }
            counter++
        }
    }
}