package com.infosupport.promptyard.search

data class ContentItemEvent(
    val contentItemId: Long,
    val eventType: ContentItemEventType,
    val contentType: String,
    val slug: String? = null,
    val content: String? = null,
    val description: String? = null,
    val tags: List<String>? = null,
    val authorFullName: String? = null,
)
