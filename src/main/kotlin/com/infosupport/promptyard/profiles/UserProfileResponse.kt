package com.infosupport.promptyard.profiles

import kotlinx.serialization.Serializable

@Serializable
data class UserProfileResponse(
    val id: Long?,
    val slug: String,
    val fullName: String,
    val emailAddress: String,
    val businessUnit: String?,
    val jobTitle: String?,
    val privacyAcceptedAt: String? = null,
    val createdAt: String,
    val modifiedAt: String?
)
