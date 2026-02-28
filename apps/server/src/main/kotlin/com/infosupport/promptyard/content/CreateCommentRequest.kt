package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class CreateCommentRequest(
    val text: String
)
