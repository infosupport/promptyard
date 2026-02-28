package com.infosupport.promptyard.profiles

import kotlinx.serialization.Serializable

@Serializable
data class OnboardUserRequest(
    val jobTitle: String? = null,
    val businessUnit: String? = null,
    val privacyAccepted: Boolean = false
)
