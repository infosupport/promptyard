package com.infosupport.promptyard.content

import com.infosupport.promptyard.profiles.UserProfile
import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "content_item")
@DiscriminatorColumn(name = "content_type", discriminatorType = DiscriminatorType.STRING)
class ContentItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "bigint")
    var id: Long? = null

    @Column(name = "title", nullable = false, columnDefinition = "varchar(1000)")
    lateinit var title: String

    @Column(name = "slug", nullable = false, columnDefinition = "varchar(1000)")
    lateinit var slug: String

    @Column(name = "description", nullable = false, columnDefinition = "text")
    lateinit var description: String

    @ElementCollection(targetClass = String::class, fetch = FetchType.EAGER)
    @CollectionTable(name = "content_item_tags", joinColumns = [JoinColumn(name = "content_item_id")])
    @Column(name = "tag", nullable = false, columnDefinition = "varchar(100)")
    lateinit var tags: List<String>

    @Column(name = "author_id", nullable = false, columnDefinition = "bigint")
    var authorId: Long = 0L

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", insertable = false, updatable = false)
    lateinit var author: com.infosupport.promptyard.profiles.UserProfile

    @Column(name = "created_at", nullable = false, columnDefinition = "timestamp")
    lateinit var createdAt: Instant

    @Column(name = "modified_at", nullable = true, columnDefinition = "timestamp")
    var modifiedAt: Instant? = null

    @Column(name = "content_type", nullable = false, insertable = false, updatable = false)
    lateinit var contentType: String
}