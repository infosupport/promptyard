package com.infosupport.promptyard.search

import java.time.Instant

const val CONTENT_ITEMS_INDEX = "content_items"

data class ContentItemSearchDocument(
    val slug: String,
    val title: String,
    val contentType: String,
    val content: String?,
    val description: String?,
    val tags: List<String>,
    val authorFullName: String,
    val authorSlug: String,
    val createdAt: Instant,
    val modifiedAt: Instant? = null,
)
