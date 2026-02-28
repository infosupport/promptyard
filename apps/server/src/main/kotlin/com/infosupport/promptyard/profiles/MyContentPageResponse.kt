package com.infosupport.promptyard.profiles

import kotlinx.serialization.Serializable

@Serializable
data class MyContentPageResponse(
    val items: List<MyContentItemResponse>,
    val pageIndex: Int,
    val totalPages: Int
)
