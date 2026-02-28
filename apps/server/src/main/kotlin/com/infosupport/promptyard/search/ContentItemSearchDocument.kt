package com.infosupport.promptyard.search

const val CONTENT_ITEMS_INDEX = "content_items"

data class ContentItemSearchDocument(
    val slug: String,
    val contentType: String,
    val content: String?,
    val description: String?,
    val tags: List<String>,
    val authorFullName: String,
)
