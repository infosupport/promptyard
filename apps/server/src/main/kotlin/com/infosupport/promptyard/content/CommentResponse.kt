package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class CommentResponse(
    val id: Long,
    val text: String,
    val createdAt: String,
    val authorFullName: String
)
