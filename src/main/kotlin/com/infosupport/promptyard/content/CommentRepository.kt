package com.infosupport.promptyard.content

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped

@ApplicationScoped
class CommentRepository : PanacheRepository<Comment> {
    fun findByContentItemId(contentItemId: Long): List<Comment> {
        return find(
            "SELECT c FROM Comment c JOIN FETCH c.author WHERE c.contentItemId = ?1 ORDER BY c.createdAt DESC",
            contentItemId
        ).list()
    }
}
