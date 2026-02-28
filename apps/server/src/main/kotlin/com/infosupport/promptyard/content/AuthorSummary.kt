package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class AuthorSummary(
    val fullName: String,
    val jobTitle: String?,
    val profileSlug: String,
    val promptCount: Long,
    val skillCount: Long,
    val agentCount: Long,
    val workflowCount: Long,
)
