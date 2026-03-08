package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class SubmitSkillRequest(
    val title: String,
    val description: String,
    val tags: List<String>,
    val zipFileName: String,
    val fileSize: Long,
    val fileMetadata: String,
    val previewContent: String?
)
