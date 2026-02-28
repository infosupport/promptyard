package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class SubmitPromptResponse(
    val slug: String,
)
