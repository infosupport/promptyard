package com.infosupport.promptyard.search

import java.time.Instant

data class ContentItemEvent(
    val contentItemId: Long,
    val eventType: ContentItemEventType,
    val contentType: String,
    val slug: String? = null,
    val title: String? = null,
    val content: String? = null,
    val description: String? = null,
    val tags: List<String>? = null,
    val authorFullName: String? = null,
    val authorSlug: String? = null,
    val createdAt: Instant? = null,
    val modifiedAt: Instant? = null,
)
