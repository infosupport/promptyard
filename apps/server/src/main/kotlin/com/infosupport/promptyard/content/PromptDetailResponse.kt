package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class PromptDetailResponse(
    val title: String,
    val slug: String,
    val description: String,
    val content: String,
    val tags: List<String>,
    val contentType: String,
    val createdAt: String,
    val modifiedAt: String?,
    val author: AuthorSummary,
    val isOwner: Boolean,
)
