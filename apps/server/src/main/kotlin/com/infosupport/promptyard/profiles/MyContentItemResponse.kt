package com.infosupport.promptyard.profiles

import kotlinx.serialization.Serializable

@Serializable
data class MyContentItemResponse(
    val slug: String,
    val title: String,
    val description: String,
    val tags: List<String>,
    val contentType: String,
    val authorName: String,
    val createdAt: String,
    val modifiedAt: String?
)
