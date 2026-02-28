package com.infosupport.promptyard.content

import kotlinx.serialization.Serializable

@Serializable
data class ContentItemPageResponse(
    val items: List<com.infosupport.promptyard.content.ContentItemResponse>,
    val pageIndex: Int,
    val totalPages: Int,
    val totalItems: Long,
)
