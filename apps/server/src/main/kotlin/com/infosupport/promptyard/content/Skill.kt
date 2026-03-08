package com.infosupport.promptyard.content

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity

@Entity
@DiscriminatorValue("skill")
class Skill : ContentItem() {
    @Column(name = "file_count", nullable = false, columnDefinition = "integer")
    var fileCount: Int = 0

    @Column(name = "file_size", nullable = false, columnDefinition = "bigint")
    var fileSize: Long = 0L

    @Column(name = "file_metadata", nullable = false, columnDefinition = "jsonb")
    var fileMetadata: String = ""

    @Column(name = "preview_content", nullable = true, columnDefinition = "text")
    var previewContent: String? = null
}
