package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class ContentItemAuthorResponse(
    val fullName: String
)

@Serializable
data class ContentItemResponse(
    val slug: String,
    val title: String,
    val description: String,
    val tags: List<String>,
    val contentType: String,
    val author: ContentItemAuthorResponse,
    val createdAt: String,
    val modifiedAt: String?
)
