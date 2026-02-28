package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class SubmitPromptRequest(
    val title: String,
    val description: String,
    val content: String,
    val tags: List<String>
)
