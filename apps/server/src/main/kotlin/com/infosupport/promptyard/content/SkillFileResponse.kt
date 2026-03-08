package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class SkillFileResponse(
    val fileName: String,
    val fileSize: Long,
    val isTextFile: Boolean
)
