package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfile
import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "comment")
class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "bigint")
    var id: Long? = null

    @Column(name = "text", nullable = false, columnDefinition = "text")
    lateinit var text: String

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamp with time zone")
    lateinit var createdAt: Instant

    @Column(name = "author_id", nullable = false, columnDefinition = "bigint")
    var authorId: Long = 0L

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", insertable = false, updatable = false)
    lateinit var author: UserProfile

    @Column(name = "content_item_id", nullable = false, columnDefinition = "bigint")
    var contentItemId: Long = 0L

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "content_item_id", insertable = false, updatable = false)
    lateinit var contentItem: ContentItem
}
