package com.infosupport.promptyard.profiles

import kotlinx.serialization.Serializable

@Serializable
data class UpdateProfileRequest(
    val jobTitle: String? = null,
    val businessUnit: String? = null
)

