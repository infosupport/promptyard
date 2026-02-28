package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class UpdatePromptResponse(
    val slug: String,
)
