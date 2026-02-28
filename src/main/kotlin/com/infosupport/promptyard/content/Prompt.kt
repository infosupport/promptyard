package com.infosupport.promptyard.content

import jakarta.persistence.Column
import jakarta.persistence.DiscriminatorValue
import jakarta.persistence.Entity

@Entity
@DiscriminatorValue("prompt")
class Prompt : com.infosupport.promptyard.content.ContentItem() {
    @Column(name = "content", nullable = true, columnDefinition = "text")
    lateinit var content: String
}