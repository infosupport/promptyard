package com.infosupport.promptyard.content

import io.quarkus.hibernate.orm.panache.kotlin.PanacheQuery
import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import io.quarkus.panache.common.Page
import io.quarkus.panache.common.Sort
import jakarta.enterprise.context.ApplicationScoped

private const val PAGE_SIZE = 12

@ApplicationScoped
class ContentItemRepository : PanacheRepository<com.infosupport.promptyard.content.ContentItem> {
    fun existsBySlugAndContentType(slug: String, contentType: String): Boolean {
        return count(
            "slug = ?1 and contentType = ?2",
            slug,
            contentType
        ) > 0
    }

    fun findBySlug(slug: String): com.infosupport.promptyard.content.ContentItem? {
        return find("slug", slug).firstResult()
    }

    fun countByAuthorIdAndContentType(authorId: Long, contentType: String): Long {
        return count("authorId = ?1 and contentType = ?2", authorId, contentType)
    }

    fun findPaged(pageIndex: Int): PanacheQuery<com.infosupport.promptyard.content.ContentItem> {
        val sort = Sort.by("modifiedAt", Sort.Direction.Descending)
            .and("createdAt", Sort.Direction.Descending)
        return findAll(sort)
            .page(Page.of(pageIndex, _root_ide_package_.com.infosupport.promptyard.content.PAGE_SIZE))
    }

    fun findPagedByAuthorId(authorId: Long, pageIndex: Int): PanacheQuery<com.infosupport.promptyard.content.ContentItem> {
        val sort = Sort.by("createdAt", Sort.Direction.Descending)
        return find("authorId = ?1", sort, authorId)
            .page(Page.of(pageIndex, _root_ide_package_.com.infosupport.promptyard.content.PAGE_SIZE))
    }
}